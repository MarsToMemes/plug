"""
Anatomical brain sequence for "seeing a face": the cortex of fsaverage5 (FreeSurfer,
an average of 40 real MRI brains, shipped with nilearn), rendered with Cycles.
Activity follows the visual route of a face, restrained: early visual cortex at the
occipital pole, then the occipital face area, then the fusiform face area on the
underside of the temporal lobe (stronger on the right, as in most people).

Usage: python brain.py OUT_DIR [--still FRAME] [--res 1280x720] [--samples N]
"""
import math
import sys

import bpy
import nibabel as nib
import numpy as np

args = sys.argv[1:]
OUT = args[0]
STILL = int(args[args.index('--still') + 1]) if '--still' in args else None
RES = args[args.index('--res') + 1] if '--res' in args else '1280x720'
SAMPLES = int(args[args.index('--samples') + 1]) if '--samples' in args else 64
W, H = map(int, RES.split('x'))
FPS, FRAMES = 25, 225  # 9 s
MESH = '/home/user/brainfx/mesh'

# Regions (MNI-like mm on fsaverage), radius in mm, onset/peak in seconds.
REGIONS = {
    'v1': {'centers': [(-8, -98, 2), (10, -98, 2)], 'radius': 16, 'times': (1.6, 3.0)},
    'ofa': {'centers': [(-38, -82, -10), (40, -80, -10)], 'radius': 11, 'times': (2.8, 4.2)},
    'ffa': {'centers': [(-38, -56, -18), (40, -54, -18)], 'radius': 10, 'times': (3.8, 5.4)},
}
RIGHT_GAIN = {'v1': 1.0, 'ofa': 0.9, 'ffa': 1.0}
LEFT_GAIN = {'v1': 1.0, 'ofa': 0.6, 'ffa': 0.55}

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.04
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 2
scene.cycles.transparent_max_bounces = 2
scene.render.use_persistent_data = True
scene.render.resolution_x, scene.render.resolution_y = W, H
scene.render.fps = FPS
import os
scene.frame_start, scene.frame_end = int(os.environ.get("START_FRAME", 1)), FRAMES
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.render.film_transparent = False


def hemisphere(side):
    g = nib.load(f'{MESH}/pial_{side}.gii.gz')
    verts = g.darrays[0].data.astype(np.float64)
    faces = g.darrays[1].data.astype(np.int64)
    sulc = nib.load(f'{MESH}/sulc_{side}.gii.gz').darrays[0].data.astype(np.float64)
    me = bpy.data.meshes.new(f'pial_{side}')
    me.from_pydata((verts * 0.01).tolist(), [], faces.tolist())
    me.update()
    for p in me.polygons:
        p.use_smooth = True
    # Depth of the folds: the sulci read darker and wetter, as on a real brain.
    a = me.attributes.new('sulc', 'FLOAT', 'POINT')
    a.data.foreach_set('value', ((sulc - sulc.min()) / (sulc.max() - sulc.min())).astype(np.float32))
    gains = RIGHT_GAIN if side == 'right' else LEFT_GAIN
    for name, r in REGIONS.items():
        d = np.min([np.linalg.norm(verts - np.array(c), axis=1) for c in r['centers']], axis=0)
        w = np.exp(-(d / r['radius']) ** 2) * gains[name]
        at = me.attributes.new(name, 'FLOAT', 'POINT')
        at.data.foreach_set('value', w.astype(np.float32))
    ob = bpy.data.objects.new(f'pial_{side}', me)
    scene.collection.objects.link(ob)
    sub = ob.modifiers.new('subd', 'SUBSURF')
    sub.levels = sub.render_levels = 2
    return ob


left, right = hemisphere('left'), hemisphere('right')

# Tissue: pink-grey, a little translucent (subsurface), wet but not glossy.
mat = bpy.data.materials.new('cortex')
mat.use_nodes = True
nt = mat.node_tree
n, l = nt.nodes, nt.links
n.clear()
out = n.new('ShaderNodeOutputMaterial')
bsdf = n.new('ShaderNodeBsdfPrincipled')
bsdf.subsurface_method = 'BURLEY'
bsdf.inputs['Roughness'].default_value = 0.55
bsdf.inputs['Subsurface Weight'].default_value = 0.6
bsdf.inputs['Subsurface Radius'].default_value = (0.012, 0.005, 0.003)
bsdf.inputs['Subsurface Scale'].default_value = 0.6
bsdf.inputs['Coat Weight'].default_value = 0.06
bsdf.inputs['Coat Roughness'].default_value = 0.25
l.new(bsdf.outputs[0], out.inputs['Surface'])

sulc = n.new('ShaderNodeAttribute'); sulc.attribute_name = 'sulc'
ramp = n.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = 0.0, (0.50, 0.36, 0.33, 1)
ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = 1.0, (0.20, 0.12, 0.11, 1)
l.new(sulc.outputs['Fac'], ramp.inputs['Fac'])

# Fine mottling and faint surface vessels, so the tissue does not look like plastic.
tex = n.new('ShaderNodeTexCoord')
noise = n.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 420; noise.inputs['Detail'].default_value = 6
mott = n.new('ShaderNodeMixRGB'); mott.blend_type = 'MULTIPLY'; mott.inputs['Fac'].default_value = 0.18
l.new(tex.outputs['Object'], noise.inputs['Vector'])
l.new(ramp.outputs['Color'], mott.inputs['Color1'])
l.new(noise.outputs['Color'], mott.inputs['Color2'])
vor = n.new('ShaderNodeTexVoronoi'); vor.feature = 'DISTANCE_TO_EDGE'; vor.inputs['Scale'].default_value = 9
warp = n.new('ShaderNodeTexNoise'); warp.inputs['Scale'].default_value = 4
wmix = n.new('ShaderNodeMixRGB'); wmix.inputs['Fac'].default_value = 0.35
l.new(tex.outputs['Object'], wmix.inputs['Color1']); l.new(warp.outputs['Color'], wmix.inputs['Color2'])
l.new(wmix.outputs['Color'], vor.inputs['Vector'])
vess = n.new('ShaderNodeMapRange')
vess.inputs['From Min'].default_value, vess.inputs['From Max'].default_value = 0.0, 0.035
vess.inputs['To Min'].default_value, vess.inputs['To Max'].default_value = 1.0, 0.0
l.new(vor.outputs['Distance'], vess.inputs['Value'])
vmix = n.new('ShaderNodeMixRGB'); vmix.inputs['Color2'].default_value = (0.36, 0.08, 0.09, 1)
vfac = n.new('ShaderNodeMath'); vfac.operation = 'MULTIPLY'; vfac.inputs[1].default_value = 0.0
l.new(vess.outputs['Result'], vfac.inputs[0]); l.new(vfac.outputs[0], vmix.inputs['Fac'])
l.new(mott.outputs['Color'], vmix.inputs['Color1'])

# Activity: a warm flush in the tissue (more blood, as fMRI measures), not light.
# Each region rises then settles; a slow noise makes it breathe instead of blink.
act_total = None
for name, r in REGIONS.items():
    at = n.new('ShaderNodeAttribute'); at.attribute_name = name
    level = n.new('ShaderNodeValue'); level.name = f'level_{name}'
    on, peak = r['times']
    kf = [(0.0, 0.0), (on, 0.0), (peak, 1.0), (peak + 1.4, 0.7), (7.6, 0.55), (8.6, 0.0)]
    for t, v in kf:
        level.outputs[0].default_value = v
        level.outputs[0].keyframe_insert('default_value', frame=1 + t * FPS)
    m = n.new('ShaderNodeMath'); m.operation = 'MULTIPLY'
    l.new(at.outputs['Fac'], m.inputs[0]); l.new(level.outputs[0], m.inputs[1])
    if act_total is None:
        act_total = m
    else:
        s = n.new('ShaderNodeMath'); s.operation = 'MAXIMUM'
        l.new(act_total.outputs[0], s.inputs[0]); l.new(m.outputs[0], s.inputs[1]); act_total = s
breath = n.new('ShaderNodeTexNoise'); breath.noise_dimensions = '4D'; breath.inputs['Scale'].default_value = 30
l.new(tex.outputs['Object'], breath.inputs['Vector'])
breath.inputs['W'].default_value = 0.0
breath.inputs['W'].keyframe_insert('default_value', frame=1)
breath.inputs['W'].default_value = 3.0
breath.inputs['W'].keyframe_insert('default_value', frame=FRAMES)
bmul = n.new('ShaderNodeMapRange')
bmul.inputs['From Min'].default_value, bmul.inputs['From Max'].default_value = 0.3, 0.7
bmul.inputs['To Min'].default_value, bmul.inputs['To Max'].default_value = 0.7, 1.0
l.new(breath.outputs['Fac'], bmul.inputs['Value'])
act = n.new('ShaderNodeMath'); act.operation = 'MULTIPLY'
l.new(act_total.outputs[0], act.inputs[0]); l.new(bmul.outputs['Result'], act.inputs[1])
flush = n.new('ShaderNodeMixRGB'); flush.inputs['Color2'].default_value = (0.78, 0.30, 0.20, 1)
fl = n.new('ShaderNodeMath'); fl.operation = 'MULTIPLY'; fl.inputs[1].default_value = 0.9
l.new(act.outputs[0], fl.inputs[0]); l.new(fl.outputs[0], flush.inputs['Fac'])
l.new(vmix.outputs['Color'], flush.inputs['Color1'])
l.new(flush.outputs['Color'], bsdf.inputs['Base Color'])
# A whisper of warmth from inside the tissue where active (dark grade keeps it subtle).
em = n.new('ShaderNodeMath'); em.operation = 'MULTIPLY'; em.inputs[1].default_value = 0.6
l.new(act.outputs[0], em.inputs[0])
bsdf.inputs['Emission Color'].default_value = (0.9, 0.35, 0.22, 1)
l.new(em.outputs[0], bsdf.inputs['Emission Strength'])

bump = n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.22
l.new(noise.outputs['Fac'], bump.inputs['Height']); l.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
for ob in (left, right):
    ob.data.materials.append(mat)

# World: near black, a faint cool gradient.
world = bpy.data.worlds.new('w'); scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.006, 0.007, 0.009, 1)
bg.inputs['Strength'].default_value = 1.0


def area(name, loc, target, energy, size, color):
    li = bpy.data.lights.new(name, 'AREA'); li.energy = energy; li.size = size; li.color = color
    ob = bpy.data.objects.new(name, li); scene.collection.objects.link(ob)
    ob.location = loc
    d = ob.constraints.new('TRACK_TO'); d.target = target; d.track_axis = 'TRACK_NEGATIVE_Z'; d.up_axis = 'UP_Y'
    return li


focus = bpy.data.objects.new('focus', None); scene.collection.objects.link(focus)
# Lights: soft warm key from the side, cool rim from behind, faint fill from below.
key = area('key', (2.2, 0.8, 0.6), focus, 170, 1.2, (1.0, 0.92, 0.84))
rim = area('rim', (-1.0, -2.0, 0.4), focus, 140, 0.8, (0.78, 0.86, 1.0))
fill = area('fill', (0.8, -0.4, -2.2), focus, 40, 1.5, (1.0, 0.95, 0.9))
# From the pupil's darkness: the light comes up, then goes back down at the end.
for li, e in ((key, 150), (rim, 140), (fill, 40)):
    for t, v in ((0.0, 0.0), (1.4, e), (7.8, e), (9.0, 0.0)):
        li.energy = v
        li.keyframe_insert('energy', frame=1 + t * FPS)

# Camera: seen from below and to the right, gliding from the occipital pole forward
# along the underside of the temporal lobe (the fusiform gyrus), slowly closing in.
cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 50
cam_data.dof.use_dof = True; cam_data.dof.aperture_fstop = 5.6; cam_data.dof.focus_object = focus
cam = bpy.data.objects.new('cam', cam_data); scene.collection.objects.link(cam); scene.camera = cam
tc = cam.constraints.new('TRACK_TO'); tc.target = focus; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
path = [  # time, camera location, focus point (metres, 1 unit = 100 mm)
    (0.0, (3.40, -0.55, 0.05), (0.20, -0.25, 0.10)),
    (3.0, (3.00, -1.10, -0.85), (0.25, -0.40, 0.00)),
    (6.0, (2.20, -1.25, -1.55), (0.32, -0.50, -0.10)),
    (9.0, (1.55, -1.05, -1.60), (0.38, -0.55, -0.16)),
]
for t, c, f in path:
    cam.location = c; focus.location = f
    cam.keyframe_insert('location', frame=1 + t * FPS)
    focus.keyframe_insert('location', frame=1 + t * FPS)
scene.render.image_settings.file_format = 'PNG'
if STILL is not None:
    scene.frame_set(STILL)
    scene.render.filepath = f'{OUT}/still_{STILL:04d}.png'
    bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = f'{OUT}/f_'
    bpy.ops.render.render(animation=True)
