from django.shortcuts import render
from django.core.urlresolvers import reverse
from django.views.decorators.http import require_POST
from django.http import HttpResponse

from omeroweb.decorators import login_required
from omeroweb.webclient import views as webclient_views
from omeroweb.webgateway import views as webgateway_views

import json
from io import BytesIO

import omero.scripts as scripts
from omero.rtypes import rlong, rstring
from omero.gateway import BlitzGateway
from omero.model import FileAnnotationI, OriginalFileI, TagAnnotationI
from omero.sys import ParametersI

#def getImageFromID(conn, idNumber):
    #print(idNumber)
    #img = conn.getObject('Image', idNumber)
    #displayed_images = []
    #displayed_images.append({'id': img.id, 'name': img.name})
    #return displayed_images

# login_required: if not logged-in, will redirect to webclient
# login page. Then back to here, passing in the 'conn' connection
# and other arguments **kwargs.


JSON_FILEANN_NS = "omero.web.figure.json"


def channelMarshal(channel):
    """
    Return a dict with all there is to know about a channel.

    NB: This is copied from omeroweb.webgateway.marshal.py since we don't know
    that OMERO.web is installed on same environment as scripts

    @param channel:     L{omero.gateway.ChannelWrapper}
    @return:            Dict
    """
    chan = {
            'label': channel.getLabel(),
            'color': channel.getColor().getHtml(),
            'inverted': channel.isInverted(),
            'window': {'min': channel.getWindowMin(),
                       'max': channel.getWindowMax(),
                       'start': channel.getWindowStart(),
                       'end': channel.getWindowEnd()},
            'active': False,    # channel.isActive()
        }
    lut = channel.getLut()
    if lut and len(lut) > 0:
        chan['lut'] = lut
    return chan

def customChannelMarshal(request):
    channel_params = {}
    return channel_params


def get_timestamps(conn, image):
    """Return a list of times (secs) 1 for each T-index in image."""
    params = ParametersI()
    params.addLong('pid', image.getPixelsId())
    query = "from PlaneInfo as Info where"\
        " Info.theZ=0 and Info.theC=0 and pixels.id=:pid"
    info_list = conn.getQueryService().findAllByQuery(
        query, params, conn.SERVICE_OPTS)
    timemap = {}
    for info in info_list:
        t_index = info.theT.getValue()
        if info.deltaT is not None:
            delta_t = info.deltaT.getValue()
            timemap[t_index] = round(delta_t, 2)
    time_list = []
    for t in range(image.getSizeT()):
        if t in timemap:
            time_list.append(timemap[t])
    return time_list


def create_figure_file(conn, figure_json, figure_name):
    """Create Figure FileAnnotation from json data."""
    if len(figure_json['panels']) == 0:
        raise Exception('No Panels')
    first_img_id = figure_json['panels'][0]['imageId']

    # we store json in description field...
    description = {}
    description['name'] = figure_name
    description['imageId'] = first_img_id

    # Try to set Group context to the same as first image
    conn.SERVICE_OPTS.setOmeroGroup('-1')
    i = conn.getObject("Image", first_img_id)
    gid = i.getDetails().getGroup().getId()
    conn.SERVICE_OPTS.setOmeroGroup(gid)

    json_bytes = json.dumps(figure_json).encode('utf-8')
    file_size = len(json_bytes)
    f = BytesIO()
    try:
        f.write(json_bytes)

        update = conn.getUpdateService()
        orig_file = conn.createOriginalFileFromFileObj(
            f, '', figure_name, file_size, mimetype="application/json")
    finally:
        f.close()
    fa = FileAnnotationI()
    fa.setFile(OriginalFileI(orig_file.getId(), False))
    fa.setNs(rstring(JSON_FILEANN_NS))
    desc = json.dumps(description)
    fa.setDescription(rstring(desc))
    fa = update.saveAndReturnObject(fa, conn.SERVICE_OPTS)
    return fa.getId().getValue()


def get_ch_label(image, ch_index):
    channel = image.getChannels()[ch_index]
    # positions are: top, left, right, leftvert, bottom, topleft,
    # topright, bottomleft, bottomright
    return {
        "text": channel.getLabel(),
        "size": 12,
        "position": "top",
        "color": channel.getColor().getHtml()
    }


def get_image_labels(image, params):
    """Create image labels from Name or Tags."""
    labels = []
    if params['Row_Labels'] == 'Name':
        labels.append({"text": image.getName(),
                       "size": 12,
                       "position": "leftvert",
                       "color": "000000"})
    elif params['Row_Labels'] == 'Tags':
        # Get Tags on the Image
        for ann in image.listAnnotations():
            if ann.OMERO_TYPE == TagAnnotationI:
                labels.append({
                    "text": ann.getTextValue(),
                    "size": 12,
                    "position": "leftvert",
                    "color": "000000",
                })
    return labels


def get_scalebar_json():
    """Return JSON to add a 10 micron scalebar to bottom-right."""
    return {"show": True,
            "length": 10,
            "units": "MICROMETER",
            "position": "bottomright",
            "color": "FFFFFF",
            "show_label": True,
            "font_size": 10}


def getRealColor(ch_index, request):
    if request.POST.get('lut_%s' % ch_index) == '':
        color = request.POST.get('color_%s' % ch_index)
    else:
        color = request.POST.get('lut_%s' % ch_index)
    return color

def getActiveBoolean(ch_index, request):
    if request.POST.get('active-or-not_%s' % ch_index) == 'on':
        activeBoolean = True
    else:
        activeBoolean = False
    return activeBoolean

def get_panel_json(request, image, x, y, width, height, c_index=None):
    """Get json for a figure panel."""
    px = image.getPrimaryPixels().getPhysicalSizeX()
    py = image.getPrimaryPixels().getPhysicalSizeY()

    # channelMarshal gives us 'active':False for each channel
    #channels = [channelMarshal(x) for x in image.getChannels()]

    #channel_dict['inverted'] = channel.isInverted(),

    channels = []
    for ch_index in range(image.getSizeC()):
        channel_dict = {}
        minmaxPixelValues = request.POST.get('minmaxPixelValues_%s' % ch_index).split(" - ")
        channel_dict['label'] = request.POST.get('channel_%s' % ch_index)
        channel_dict['color'] = getRealColor(ch_index, request)
        channel_dict['active'] = getActiveBoolean(ch_index, request)
        channel_dict['window'] = {
            'min': minmaxPixelValues[0],
            'max': minmaxPixelValues[1],
            'start': 0,
            'end': int(request.POST.get('RealDynamicRange'))}
        #context['color_%s' % ch_index] = color
        #channel_lut = request.POST.get('lut_%s' % ch_index)
        #context['lut_%s' % ch_index] = lut
        #print(ch_index, color, lut)
        #minmaxPixelValues = request.POST.get('minmaxPixelValues_'+ch_index)
        #context['minmaxPixelValues_'+ch_index] = minmaxPixelValues
        channels.append(channel_dict)

    # Just turn on 1 channel
    if c_index is not None:
        channels[c_index]['active'] = True
    else:
        # Or ALL channels (merged image)
        for c in channels:
            c['active'] = True

    img_json = {
        "imageId": image.id,
        "y": y,
        "x": x,
        "width": width,
        "height": height,
        "orig_width": image.getSizeX(),
        "orig_height": image.getSizeY(),
        "sizeT": image.getSizeT(),
        "sizeZ": image.getSizeZ(),
        "channels": channels,
        "name": image.getName(),
        "theT": image.getDefaultT(),
        "theZ": image.getDefaultZ(),
        "labels": [],
    }

    if px is not None:
        img_json["pixel_size_x"] = px.getValue()
        img_json["pixel_size_x_unit"] = str(px.getUnit())
        img_json["pixel_size_x_symbol"] = px.getSymbol()
    if py is not None:
        img_json["pixel_size_y"] = py.getValue()
    if image.getSizeT() > 1:
        img_json['deltaT'] = get_timestamps(conn, image)
    return img_json

def create_omero_figure_from_image(conn, image, request):

    context = {}

    context['Row_Labels'] = 'Name'
    context['Figure_Name'] = 'default'
    context['selected_image'] = image
    print("CONTEXT", context)
    figure_name = context['Figure_Name']

    """Create OMERO.figure from given images."""
    figure_json = {"version": 5}

    panel_width = 80
    panel_height = panel_width
    spacing = panel_width/20
    margin = 40
    vertical_margin = 40

    panels_json = []

    print('image', image.id, image.name)
    panel_x = margin
    panel_y = vertical_margin
    for col in range(image.getSizeC()):
        j = get_panel_json(request, image, panel_x, panel_y,panel_width, panel_height, col)
        if col == 0:
            j['labels'].extend(get_image_labels(image, context))
        panels_json.append(j)
        panel_x += panel_width + spacing
    # Add merged panel
    j = get_panel_json(request, image, panel_x, panel_y, panel_width, panel_height)
    panels_json.append(j)
    # Add scalebar to last panel
    panels_json[-1]['scalebar'] = get_scalebar_json()

    figure_json['panels'] = panels_json


    print("---create_omero_figure_from_image---")
    print(figure_name)
    print(figure_json)

    return create_figure_file(conn, figure_json, figure_name)



@require_POST
@login_required()
def handle_submit(request, conn=None, **kwargs):
    print("REQUEST", request)
    print("KWARGS", kwargs)
    print("REQUEST_BODY", request.body)
    print("REQUEST_POST", request.POST)
    print("REQUEST_GET", request.GET) #vide

    selected_image = request.POST.get('selected_image')
    print('selected_image', selected_image)
    print("CONNECTION", conn.getObjects('Project'))
    image = conn.getObject('Image', selected_image)
    print("IMAGE_OBJECT", image)

    dataTypes = [rstring('Image')]
    labelTypes = [rstring('Name'), rstring('Tags')]

    #client = omero.webclient(omero.ibl.local)

    figure_id = create_omero_figure_from_image(conn, image, request)
    message = "Created figure: %s" % figure_id
    #client.setOutput("Message", rstring(message))
    print(message)
    return HttpResponse("Thankyou")

@login_required()
def getImageFromID():
    pass


@login_required()
def index(request, conn=None, **kwargs):

    # We can load data from OMERO via Blitz Gateway connection.
    # See https://docs.openmicroscopy.org/latest/omero/developers/Python.html
    experimenter = conn.getUser()

    # A dictionary of data to pass to the html template
    context = {'firstName': experimenter.firstName,
               'lastName': experimenter.lastName,
               'experimenterId': experimenter.id
               }
    #print("CONTEXT", context)

    #dataset_id = request.GET.get('dataset', None)
    print("Start")

    selected_images_IDs = webclient_views.get_list(request, 'image')
    selected_images_IDs_integers = []
    selected_images = []
    for string_id in selected_images_IDs:
        int_id = int(string_id)
        selected_images_IDs_integers.append(int_id)
        selected_image = conn.getObject('Image', int_id)
        #selected_images.append({'id': selected_image.id, 'name': selected_image.name})
        selected_images.append(selected_image)
    context['selected_images'] = selected_images

    #val = request.GET.getlist('projects')
    #val = request.GET.get('submit_image')
    print("***Request GET parameters***: "+str(request.GET))
    print("***Request POST parameters***: "+str(request.POST))

    # print can be useful for debugging, but remove in production
    print('context', context)

    # Render the html template and return the http response
    return render(request, 'my_channel_viewer/index.html', context)


#voir https://downloads.openmicroscopy.org/omero/5.5.0/api/python/omero/omero.gateway.html
