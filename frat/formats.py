from pathlib import Path
import numpy as np
from typing import Generator, Union, List, Tuple
import json


def htmlrgb_to_uint8(color:Union[Tuple[str], List[str], str]):
    if isinstance(color, str):
        if "," in color:
            colors = tuple(color.split(","))
        else:
            colors = (color,)
    else:
        assert isinstance(color, list) or isinstance(color, tuple)
        colors = tuple(color)
    res = np.zeros([len(colors), 3], dtype=np.uint8)
    for n, color_str in enumerate(colors):
        color_str = color_str.lower()
        res[n, :] = [eval(f"0x{color_str[start: end]}") for start, end  in [(1,3), (3,5), (5,7)]]
    return res.tolist()


def rectangles_to_rgb(rect_list, rect_classes, output_size, color_palete, multiclass=False):
    if multiclass:
        return rectangles_to_rgb_multiclass(rect_list=rect_list, rect_classes=rect_classes,output_size=output_size, color_palete=color_palete)
    else:
        return rectangles_to_rgb_singleclass(rect_list=rect_list, rect_classes=rect_classes,output_size=output_size, color_palete=color_palete)
    

def rectangles_to_rgb_singleclass(rect_list, rect_classes, output_size, color_palete=[]):
    class_images = []
    output_size = output_size[1], output_size[0] # WxH to HxW
    integral_rgb = np.zeros(tuple(output_size)+(3,), dtype=np.int32)
    coverage_image = np.zeros([output_size[0], output_size[1]], dtype=np.int32)
    for classid in sorted(set(rect_classes)):
        #rgb = [classid%256, (classid//256)%256, (classid//65536)%256]
        #color_img = np.zeros([output_size[1], output_size[0]], 3, dtype=np.int32)
        rects = [rect for rect, rect_class in zip(rect_list,rect_classes) if classid==rect_class]
        for l,t,r,b in rects:
            print(f"l:{l}, t:{t}, r:{r}, b:{b} , img={output_size}")
            integral_rgb[t,l,:] += color_palete[classid]
            integral_rgb[b,r,:] += color_palete[classid]
            integral_rgb[t,r,:] -= color_palete[classid]
            integral_rgb[b,l,:] -= color_palete[classid]
            coverage_image[t,l] += 1
            coverage_image[b,r] += 1
            coverage_image[t,r] -= 1
            coverage_image[b,l] -= 1
    rgb = (integral_rgb.cumsum(axis=0).cumsum(axis=1)//coverage_image.cumsum(axis=0).cumsum(axis=1)[:,:,None])
    return rgb[:,:,[2,1,0]].astype(np.uint8)


def rectangles_to_rgb_multiclass(rect_list, rect_classes, output_size, color_palete):
    raise NotImplementedError
    class_images = []
    use_palete = color_palete is not None and len(color_palete) > 0 
    if use_palete:
        coverage_image = np.zeros([output_size[1], output_size[0]], dtype=np.int32)
    for classid in sorted(set(rect_classes)):
        #rgb = [classid%256, (classid//256)%256, (classid//65536)%256]
        if multiclass:
            class_val = 2**classid
        elif len(color_palete) > 0:
            rgb = color_palete[classid]
            class_val = eval(f"0x{rgb[1:]}")
        else:
            class_val = classid
        class_img = np.zeros([output_size[1], output_size[0]], dtype=np.int32)
        rects = [rect for rect, rect_class in zip(rect_list,rect_classes) if classid==rect_class]
        if len(rects):
            #print("I:", rgb, len(rects), "#{:06x}".format(class_val))
            print([class_val%256, (class_val//256)%256, (class_val//65536)%256])
        for l,t,r,b in rects:
            class_img[t:b,l:r]=class_val
        if use_palete:
            coverage_image += class_img==class_val
        class_images.append(class_img)
    class_images = np.stack(class_images)
    
    if multiclass and not use_palete:
        result = class_images.sum(axis=0)
        return np.stack([result%256, (result//256)%256, (result//65536)%256], axis=2).astype(np.uint8)
    if not multiclass and use_palete:
        result = class_images.sum(axis=0) // coverage_image
        rgb_result = np.stack([result%256, (result//256)%256, (result//65536)%256], axis=2) #// coverage_image[:,:,None]
        return rgb_result[:,:,::-1].astype(np.uint8)
    if not multiclass and not use_palete:
        result = class_images.max(axis=0)
        rgb_result = np.stack([result%256, (result//256)%256, (result//65536)%256], axis=2)
        return rgb_result.astype(np.uint8)
    else:
        raise ValueError("Impossible configuration")


def rectangles_to_gray(rect_list, rect_classes, output_size, multiclass=True):
    class_images = []
    for classid in sorted(set(rect_classes)):
        if multiclass:
            class_val = 2**classid
        else:
            class_val = classid
        class_img = np.zeros([output_size[1], output_size[0]], dtype=np.int32)
        rects = [rect for rect, rect_class in zip(rect_list,rect_classes) if classid==rect_class]
        for l,t,r,b in rects:
            class_img[t:b,l:r]=class_val
        class_images.append(class_img)
    class_images = np.stack(class_images)
    if multiclass:
        return class_images.sum(axis=0).astype(np.uint8)
    else:
        return class_images.max(axis=0).astype(np.uint8)


def get_rectangles(gt_dict: Union[dict ,str]) -> Generator[Tuple[List[int], int, str, List[int], Tuple[float, float, float, float]], None, None]:
    if isinstance(gt_dict, str) and Path(gt_dict).is_file():
        gt_dict = json.load(open(gt_dict, "r"))
    elif isinstance(gt_dict, str):
        try:
            gt_dict =json.loads(gt_dict)
        except json.JSONDecodeError:
            raise ValueError("gt_dict is a string but not a valid JSON or file path")
    else:
        assert isinstance(gt_dict, dict)
    LTRB = gt_dict["rect_LTRB"]
    captions = gt_dict["rect_captions"]
    class_names = {n: cl_names for n, cl_names in enumerate(gt_dict["class_names"])}
    class_colors = {n: cl_colors for n, cl_colors in enumerate(gt_dict["class_colors"])}
    rect_classes = [gt_dict["rect_classes"][n] for n in range(len(LTRB))]
    rect_colors = [class_colors[rect_classes[n]] for n in range(len(LTRB))]
    width, height = gt_dict["image_wh"]
    relative_rects = [(l/width, t/height, r/width, b/height) for l,t,r,b in LTRB]
    for n in range(len(LTRB)):
        yield LTRB[n], rect_classes[n], captions[n], rect_colors[n], relative_rects[n]
