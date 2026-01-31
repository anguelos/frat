from typing import Union, List, Tuple, Generator
import json
from pathlib import Path


def get_rectangles(gt_dict: Union[dict ,str]) -> Tuple[List[Tuple[int, int, int, int]], List[str], List[str], List[Tuple[float, float, float, float]]]:    
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
    rect_classes = gt_dict["rect_classes"]
    rect_class_names = [class_names[n] for n in rect_classes]
    rect_colors = [class_colors[n] for n in rect_classes]
    width, height = gt_dict["image_wh"]
    relative_rects = [(l/width, t/height, r/width, b/height) for l,t,r,b in LTRB]
    return LTRB, rect_classes, rect_class_names, captions, rect_colors, relative_rects


def iterate_rectangles(gt_dict: Union[dict ,str]) -> Generator[Tuple[Tuple[int, int, int, int], int, str, str, str, Tuple[float, float, float, float]], None, None]:
    LTRB, rect_classes, rect_class_names, captions, rect_colors, relative_rects = get_rectangles(gt_dict)
    for n in range(len(LTRB)):
        yield LTRB[n], rect_classes[n], rect_class_names[n], captions[n], rect_colors[n], relative_rects[n]

