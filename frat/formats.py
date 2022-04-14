import numpy as np


def rectangles_to_img(rect_list, rect_classes, output_size, multiclass=True, rgb_output=True, color_palete=[]):
    class_images = []
    for classid in sorted(set(rect_classes)):
        if multiclass:
            class_val = 2**classid
        elif len(color_palete) > 0:
            rgb = color_palete[classid]
            class_val = eval(f"0x{rgb[1:3]}")*65536+eval(f"0x{rgb[4:5]}")*256+eval(f"0x{rgb[6:7]}")
        else:
            class_val = classid
        class_img = np.zeros(output_size, dtype=np.int32)
        rects = [rect for rect, rect_class in zip(rect_list,rect_classes) if classid==rect_class]
        for l,t,r,b in rects:
            class_img[t:b,l:r]=class_val
        class_images.append(class_img)
    class_images = np.stack(class_images)
    if multiclass:
        result = class_images.sum(axis=0)
    else:
        result = class_images.max(axis=0)
    if not rgb_output:
        return result.astype(np.uint8)
    else:
        return np.stack([result%256, (result//256)%256, (result//65536)%256], axis=2).astype(np.uint8)