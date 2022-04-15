import numpy as np


def rectangles_to_rgb(rect_list, rect_classes, output_size, multiclass=True, color_palete=[]):
    class_images = []
    use_palete = color_palete is not None and len(color_palete) > 0 
    if use_palete:
        coverage_image = np.zeros([output_size[1], output_size[0]], dtype=np.int32)
    for classid in sorted(set(rect_classes)):
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
            print("I:", rgb, len(rects), "#{:06x}".format(class_val))
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
