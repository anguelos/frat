function ui_warn(msg){
    console.warn(msg);
}
function ui_error(msg){
    alert(msg);
}
function dbg_log(msg){
    console.warn(JSON.stringify(msg));
}


class Canvaces{
    constructor(id,class_selection,config_divid, navigation_divid, canvaces_divid,commands_divid, selected_divid, img_url, rect_class_data_json,config){
        this.page_id = id;
        this.class_selection_ui = class_selection
        this.class_selection_ui.frat_ui=this;
        this.config = config;
        this.config={caption_font:"18pt Calibri",
                    shortcut_code_next: "n",
                    shortcut_code_previous: "shift+n",
                    shortcut_code_delete: "delete",
                    shortcut_code_edit: "enter",
                    gui_scale:0.5
                }
        var self = this;
        this.active = [];
        //this.set_classes(classes_json);
        //this.set_boxes(gt_json);
        let rect_class_data = JSON.parse(rect_class_data_json);
        this.set_classes(rect_class_data.classes);
        this.set_boxes(rect_class_data.rects);

        this.commands_div = document.getElementById(commands_divid);
        this.canvaces_div = document.getElementById(canvaces_divid);
        this.selected_div = document.getElementById(selected_divid);
        this.config_div = document.getElementById(config_divid);
        this.navigation_div = document.getElementById(navigation_divid);
        this.create_canvaces();
        this.create_interactive();
        this.create_commands();
        this.create_config();
        this.create_navigation();
        
        this.img.onload = function(){
            self.initialise_from_image();
            self.cmd_reload();
            alert("Widths:"+window.innerWidth+" ,"+window.outerWidth);
        }
        this.img.src = img_url;
        this.update_scales();
    }
    update_scales(){
        this.detected_scale = window.innerWidth/window.outerWidth;
        //this.detected_scale = window.outerWidth/window.innerWidth;
        //const transform = "scale("+this.detected_scale+");";
        //const transform = "translate("+(this.detected_scale*100-100)+",0);";
        //alert("transform:"+transform);
        //this.navigation_div.style.transform = transform;
        //this.commands_div.style.zoom = transform;
        //this.class_selection_ui.dom_selector_div.style.zoom = transform;
        this.navigation_div.style.transform = this.detected_scale*this.config.gui_scale;
        this.commands_div.style.zoom = this.detected_scale*this.config.gui_scale;
        this.class_selection_ui.dom_selector_div.style.zoom = this.detected_scale*this.config.gui_scale;
        this.selected_div.style.zoom = this.detected_scale*this.config.gui_scale;
    }
    cmd_select_next(){
        if(this.rect_LTRB.length>0){
            if(this.active.length>0){
                this.set_active([(this.active[0]+1)%this.rect_LTRB.length]);
            }else{
                this.set_active([0]);
            }
        }
        ui_warn("No Items exist to be selected");
    }

    cmd_select_prev(){
        if(this.rect_LTRB.length>0){
            if(this.active.length>0){
                this.active = [(this.active[0]+this.rect_LTRB.length-1)%this.rect_LTRB.length];
            }else{
                this.active= [this.rect_LTRB.length-1];
            }
            this.draw_active();
        }
        ui_warn("No Items exist to be selected");    
    }
    cmd_edit_caption(){
        if(this.active.length==1){
            this.rect_captions[this.active[0]] = prompt("Transcription:", this.rect_captions[this.active[0]]);
            if(this.rect_captions[this.active[0]]===null){
                this.rect_captions[this.active[0]] = "";
            }
            this.draw_boxes();
        }else{
            ui_warn("Select a single item to edit caption");
        }
    }
    cmd_delete_selected(){
        if(this.active.length>0){
            let selected = this.active.slice();
            selected.sort().reverse();
            for(let item of selected){
                this.undelete_rect_LTRB.push(this.rect_LTRB.splice(item,1));
                this.undelete_rect_captions.push(this.rect_captions.splice(item,1));
                this.undelete_rect_classes.push(this.rect_classes.splice(item,1));
            }
            if(this.rect_LTRB.length>this.active[0]){
                this.active=[this.active[0]];
            }else{
                this.active=[];
            }
            this.draw_boxes();
            this.set_active(this.active);
        }else{
            ui_warn("No items selected to delete");
        }
    }
    cmd_undelete(){
        if(this.undelete_rect_LTRB.length>0){
            let undeleted_idx = [];
            for(let n=0;n<this.undelete_rect_LTRB.length;n++){
                undeleted_idx.push(this.rect_LTRB.length);
                this.rect_LTRB.push(this.undelete_rect_LTRB[n]);
                this.rect_captions.push(this.undelete_rect_captions[n]);
                this.rect_classes.push(this.undelete_rect_classes[n]);
            }
            this.active = undeleted_idx;
            this.draw_boxes();
            this.set_active(this.active);
        }else{
            ui_warn("No items in the undelete bin");
        }

    }
    cmd_merge_selected(){
        let active = JSON.parse(JSON.stringify(this.active)).sort().reverse(); 
        let to_be_merged_LTRB=[];
        let to_be_merged_classes=[];
        let to_be_merged_captions=[];
        for(let idx of active){
            let old_LTRB = this.rect_LTRB.splice(item,1)[0];
            let old_caption = this.rect_captions.splice(item,1)[0];
            let old_class = this.rect_classes.splice(item,1)[0];
        }
        for(let idx of active){
            let old_LTRB = this.rect_LTRB.splice(item,1)[0];
            let old_caption = this.rect_captions.splice(item,1)[0];
            let old_class = this.rect_classes.splice(item,1)[0];
        }
        let uniqueItems = [...new Set(items)]
    }
    cmd_help_config(){
        ui_error("cmd_help_config: help TODO");

    }
    cmd_save(){
        let xhr = new XMLHttpRequest();
        const url = "/"+this.page_id+".json";
        ui_warn("Saving to "+url);
        xhr.open("PUT", url, true);
        xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
        //xhr.onreadystatechange = function () {}; # Was here from POST example
        const data = JSON.stringify({"rect_LTRB":this.rect_LTRB,"rect_captions":this.rect_captions,"rect_classes":this.rect_classes,"class_names":this.class_names,"class_colors":this.class_colors,"user":document.getElementById('user_name').innerHTML});
        xhr.send(data);
    }

    cmd_reload(){
        var self=this;
        var xhr = new XMLHttpRequest();
        let url="/"+self.page_id+".json";
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = function() {
          var status = xhr.status;
          if (status === 200) {
            //callback(null, xhr.response);
            ui_warn("Reloading gt! Responce: '"+JSON.stringify(xhr.response)+"'");
            //data=JSON.parse(xhr.response);
            self.rect_LTRB=xhr.response.rect_LTRB;
            self.rect_captions=xhr.response.rect_captions;
            self.rect_classes=xhr.response.rect_classes;
            self.draw_boxes();
            self.set_active([]);
          } else {
            ui_warn("Reloading gt failed status:"+status+" responce:'"+xhr.response+"'");
          }
        };
        xhr.send();
    }
    cmd_zoomin(){
        this.canvaces_div.style.zoom=Math.min(this.canvaces_div.style.zoom*1.2, 4.0);
    }
    cmd_zoomout(){
        this.canvaces_div.style.zoom=Math.max(this.canvaces_div.style.zoom*0.8, 0.2);
    }
    cmd_zoomreset(){
        this.canvaces_div.style.zoom=1.0;
    }
    create_commands(){
        var self = this;
        this.commands_div.innerHTML="";
        let table = document.createElement("table");
        let row = document.createElement("tr");
        
        let td_next = document.createElement("td");
        let btn_next = document.createElement("button");
        btn_next.innerText = "Next";
        btn_next.onclick=function(){self.cmd_select_next();}
        td_next.appendChild(btn_next);
        row.appendChild(td_next);

        let td_prev = document.createElement("td");
        let btn_prev = document.createElement("button");
        btn_prev.innerText = "Previous";
        btn_prev.onclick=function(){self.cmd_select_prev();}
        td_prev.appendChild(btn_prev);
        row.appendChild(td_prev);

        let td_edit = document.createElement("td");
        let btn_edit = document.createElement("button");
        btn_edit.innerText = "Edit";
        btn_edit.onclick=function(){self.cmd_edit_caption();}
        td_edit.appendChild(btn_edit);
        row.appendChild(td_edit);

        let td_del = document.createElement("td");
        let btn_del = document.createElement("button");
        btn_del.innerText = "Delete";
        btn_del.onclick=function(){self.cmd_delete_selected();}
        td_del.appendChild(btn_del);
        row.appendChild(td_del);

        let td_undel = document.createElement("td");
        let btn_undel = document.createElement("button");
        btn_undel.innerText = "Undelete";
        btn_undel.onclick=function(){self.cmd_undelete();}
        td_undel.appendChild(btn_undel);
        row.appendChild(td_undel);

        let td_merge = document.createElement("td");
        let btn_merge = document.createElement("button");
        btn_merge.innerText = "Merge";
        btn_merge.onclick=function(){self.cmd_merge_selected();}
        td_merge.appendChild(btn_merge);
        row.appendChild(td_merge);

        let td_help = document.createElement("td");
        let btn_help = document.createElement("button");
        btn_help.innerText = "Help";
        btn_help.onclick=function(){self.cmd_help_config();}
        td_help.appendChild(btn_help);
        row.appendChild(td_help);

        let td_save = document.createElement("td");
        let btn_save = document.createElement("button");
        btn_save.innerText = "Save";
        btn_save.onclick=function(){self.cmd_save();}
        td_save.appendChild(btn_save);
        row.appendChild(td_save);

        let td_reload = document.createElement("td");
        let btn_reload = document.createElement("button");
        btn_reload.innerText = "Reload";
        btn_reload.onclick=function(){self.cmd_reload();}
        td_reload.appendChild(btn_reload);
        row.appendChild(td_reload);

        let td_zoomin = document.createElement("td");
        let btn_zoomin = document.createElement("button");
        btn_zoomin.innerText = "Zoom In";
        btn_zoomin.onclick=function(){self.cmd_zoomin();}
        td_reload.appendChild(btn_zoomin);
        row.appendChild(td_zoomin);

        let td_zoomreset = document.createElement("td");
        let btn_zoomreset = document.createElement("button");
        btn_zoomreset.innerText = "Zoom 100%";
        btn_zoomreset.onclick=function(){self.cmd_zoomreset();}
        td_zoomreset.appendChild(btn_zoomreset);
        row.appendChild(td_zoomreset);
        
        let td_zoomout = document.createElement("td");
        let btn_zoomout = document.createElement("button");
        btn_zoomout.innerText = "Zoom Out";
        btn_zoomout.onclick=function(){self.cmd_zoomout();}
        td_zoomout.appendChild(btn_zoomout);
        row.appendChild(td_zoomout);

        this.commands_div.appendChild(row);
    }
    subtract_rectangle_from_selected(del_LTRB){
        let break_LTRB=[];
        let break_captions=[];
        let break_classes=[];
        let break_indexes=[];
        for(let idx of this.active){
            let split_horiz = this.rect_LTRB[idx][0] < del_LTRB[2] && this.rect_LTRB[idx][2] > del_LTRB[0];
            let split_vert = this.rect_LTRB[idx][1] < del_LTRB[3] && this.rect_LTRB[idx][3] > del_LTRB[1];
            if(split_horiz || split_vert){ break_indexes.push(idx);}
        }
        break_indexes.sort().reverse();
        for(let item of break_indexes){
            let old_LTRB = this.rect_LTRB.splice(item,1)[0];
            let old_caption = this.rect_captions.splice(item,1)[0];
            let old_class = this.rect_classes.splice(item,1)[0];
            if((del_LTRB[0] < old_LTRB[0] && del_LTRB[2]  > old_LTRB[2]) && (del_LTRB[1] < old_LTRB[1] && del_LTRB[3]  > old_LTRB[3])){
                ui_warn("Subtracting "+old_LTRB+" totaly!");
            }else if((del_LTRB[0] > old_LTRB[0] && del_LTRB[2]  < old_LTRB[2]) && (del_LTRB[1] < old_LTRB[1] && del_LTRB[3]  > old_LTRB[3])){
                ui_warn("Spliting "+old_LTRB+" horizontaly!");
                for(let new_rect of [[old_LTRB[0],old_LTRB[1],del_LTRB[0],old_LTRB[3]],[del_LTRB[2],old_LTRB[1],old_LTRB[2],old_LTRB[3]]]){
                    if((new_rect[2]-new_rect[0])>5 && (new_rect[3]-new_rect[1])>5){ 
                        break_LTRB.push(new_rect);
                        break_captions.push(old_caption);
                        break_classes.push(old_class);
                    }
                }
            }else if((del_LTRB[0] < old_LTRB[0] && del_LTRB[2]  > old_LTRB[2]) && (del_LTRB[1] > old_LTRB[1] && del_LTRB[3]  < old_LTRB[3])){
                for(let new_rect of [[old_LTRB[0],old_LTRB[1],old_LTRB[2],del_LTRB[1]],[old_LTRB[0],del_LTRB[3],old_LTRB[2],old_LTRB[3]]]){
                    if((new_rect[2]-new_rect[0])>5 && (new_rect[3]-new_rect[1])>5){ 
                        break_LTRB.push(new_rect);
                        break_captions.push(old_caption);
                        break_classes.push(old_class);
                    }
                }
            }else if((del_LTRB[0] < old_LTRB[0] && del_LTRB[2]  > old_LTRB[0]) && (del_LTRB[1] < old_LTRB[1] && del_LTRB[3]  > old_LTRB[3])){ //Trim left
                break_LTRB.push([del_LTRB[2], old_LTRB[1], old_LTRB[2], old_LTRB[3]]);
                break_captions.push(old_caption);
                break_classes.push(old_class);
            }else if((del_LTRB[0] > old_LTRB[0] && del_LTRB[2]  > old_LTRB[2]) && (del_LTRB[1] < old_LTRB[1] && del_LTRB[3]  > old_LTRB[3])){ //Trim right
                break_LTRB.push([old_LTRB[0], old_LTRB[1], del_LTRB[0], old_LTRB[3]]);
                break_captions.push(old_caption);
                break_classes.push(old_class);
            }else if((del_LTRB[0] < old_LTRB[0] && del_LTRB[2]  > old_LTRB[2]) && (del_LTRB[1] < old_LTRB[1] && del_LTRB[3]  < old_LTRB[3])){ //Trim Top
                break_LTRB.push([old_LTRB[0], del_LTRB[3], old_LTRB[2], old_LTRB[3]]);
                break_captions.push(old_caption);
                break_classes.push(old_class);
            }else if((del_LTRB[0] < old_LTRB[0] && del_LTRB[2]  > old_LTRB[2]) && (del_LTRB[1] > old_LTRB[1] && del_LTRB[3]  > old_LTRB[3])){ //Trim Bottom
                break_LTRB.push([old_LTRB[0], old_LTRB[1], old_LTRB[2], del_LTRB[1]]);
                break_captions.push(old_caption);
                break_classes.push(old_class);
            }else{
                ui_warn("Not subtracting ["+del_LTRB+ "] from ["+old_LTRB+"]");
                break_LTRB.push(old_LTRB);
                break_classes.push(old_class);
                break_captions.push(old_caption);
            }
        }
        this.rect_LTRB = break_LTRB.concat(this.rect_LTRB);
        this.rect_captions = break_captions.concat(this.rect_captions);
        this.rect_classes = break_classes.concat(this.rect_classes);
        this.draw_boxes();
        this.set_active(Array(break_LTRB.length).keys());
        this.draw_active();
    }

    getindexes_inside_rectangle(LTRB){
        let inside_idx=[];
        for(let idx=0;idx<this.rect_LTRB.length;idx++){
            if(this.rect_LTRB[idx][0]>=LTRB[0] && this.rect_LTRB[idx][1]>=LTRB[1] && this.rect_LTRB[idx][2]<=LTRB[2] && this.rect_LTRB[idx][3]<=LTRB[3]){
                inside_idx.push(idx);
            }
        }
        return inside_idx;
    }

    initialise_from_image(){

        let self=this;
        self.cnv_image.width = self.img.width;
        self.cnv_image.height = self.img.height;
        self.ctx_image = self.cnv_image.getContext("2d");
        self.ctx_image.clearRect(0, 0, self.img.width, self.img.height);
        self.ctx_image.drawImage(self.img, 0, 0, self.img.width, self.img.height);


        self.cnv_boxes.width = self.img.width;
        self.cnv_boxes.height = self.img.height;
        self.ctx_boxes = self.cnv_boxes.getContext("2d");

        self.cnv_active.width = self.img.width;
        self.cnv_active.height = self.img.height;
        self.ctx_active = self.cnv_active.getContext("2d");

        self.cnv_interactive.width = self.img.width;
        self.cnv_interactive.height = self.img.height;
        self.ctx_interactive = self.cnv_interactive.getContext("2d");
        
        this.canvaces_div.style.width = this.img.width;
        this.canvaces_div.style.height = this.img.height;

        self.draw_boxes();
        self.create_selection();
        self.set_active([]);
        self.add_keylisteners();
        self.onunload = function(){
            self.cmd_save();
        }
    }
    add_keylisteners(){
        var self=this;
        for(let inp of document.querySelectorAll("input")){
            inp.tabIndex=-1;
        }
        for(let inp of document.querySelectorAll("button")){
            inp.tabIndex=-1;
        }
        this.canvaces_div.tabIndex=0;
        document.onkeydown = null;
        //this.canvaces_div.onkeydown = null;
        var key_listener = function(evt){
            let shortcut = evt.key.toLowerCase();
            if(evt.key=="Tab"){
                this.canvaces_div.focus();
            }
            if (evt.ctrlKey) {
                shortcut += '+ctrl';
            }
            if (evt.altKey) {
                shortcut += '+alt';
            }
            if (evt.shiftKey) {
                shortcut += '+shift';
            }
            switch(shortcut){
                // mouse modifiers to be ignored
                case "alt+alt":
                case "control+ctrl":
                case "shift+shift":
                case "shift+ctrl+shift":
                    break;
                case "=+ctrl":
                    self.update_scales();
                    break;
                    case "-+ctrl":
                        self.update_scales();
                        break;
                case self.config.shortcut_code_next:
                    self.cmd_select_next();
                    break;
                case self.config.shortcut_code_previous:
                        self.cmd_select_prev();
                    break;
                case self.config.shortcut_code_edit:
                    self.cmd_edit_caption();
                    break;
                case self.config.shortcut_code_delete:
                    self.cmd_delete_selected();
                    break;
                case self.config.shortcut_code_undelete:
                    self.cmd_undelete();
                    break;
                case self.config.shortcut_code_merge:
                    self.cmd_merge_selected();
                    break;
                default:

                    ui_warn("Unknown code:"+shortcut);
            }

        };
        document.addEventListener("keydown",key_listener);
        //this.onkeydown.addEventListener("keydown",key_listener);
    }

    sort_boxes(){
        // TODO(anguelos) handle multiactive
        let order_idx=[];
        for(let n =0;n<this.rect_LTRB.length;n++){
            let order_val=(this.rect_LTRB[n][1]+this.rect_LTRB[n][3])*30+(this.rect_LTRB[n][0]+this.rect_LTRB[n][2]);
            order_idx.push([order_val,n]);
        }
        order_idx.sort();
        let new_active=0;
        let new_LTRB=[];
        let new_captions=[];
        let new_classes=[];
        for(let n=0;n<this.rect_LTRB.length;n++){
            let old_idx=order_idx[n][1];
            if(old_idx==this.active[0]){
                new_active=n;
            }
            new_LTRB.push(this.rect_LTRB[old_idx]);
            new_captions.push(this.rect_captions[old_idx]);
            new_classes.push(this.rect_classes[old_idx]);
        }
        this.active=[new_active];
        this.rect_LTRB = new_LTRB;
        this.rect_captions = new_captions;
        this.rect_classes = new_classes;
    }

    set_selection_class(class_id){
        for(let item of this.active){
            this.rect_classes[item] = class_id;
        }
        this.draw_boxes();
        this.set_active(this.active);
    }

    set_boxes(values){
        this.rect_LTRB=[];
        this.rect_captions=[];
        this.rect_classes=[];
        this.undelete_rect_LTRB=[];
        this.undelete_rect_captions=[];
        this.undelete_rect_classes=[];
        for(let box of values){
            this.rect_LTRB.push(box.ltrb);
            this.rect_captions.push(box.transcription);
            this.rect_classes.push(parseInt(box.class_id));
        }
        this.sort_boxes();
    }
    set_classes(values){
        this.class_names = []
        this.class_colors = []
        for(let class_data of values){
            this.class_names.push(class_data.name);
            this.class_colors.push(class_data.color);
        }
    }

    draw_boxes(){
        this.ctx_boxes.clearRect(0, 0, this.img.width, this.img.height);
        let locations_by_color=[];
        for(let n=0;n<this.class_names.length;n++){
            locations_by_color.push([]);
        }
        for(let n=0;n<this.rect_LTRB.length;n++){
            locations_by_color[this.rect_classes[n]].push(this.rect_LTRB[n]);
        }
        this.ctx_boxes.clearRect(0, 0, this.img.width, this.img.height);
        this.ctx_boxes.globalAlpha = 0.2;
        for(var color_n=0; color_n<this.class_colors.length;color_n++){
            if(locations_by_color.length > 0){
                this.ctx_boxes.fillStyle = this.class_colors[color_n];
                for(let ltrb of locations_by_color[color_n]){
                        this.ctx_boxes.fillRect(ltrb[0], ltrb[1], ltrb[2]-ltrb[0], ltrb[3]-ltrb[1]);
                }
            }
        }
        this.ctx_boxes.globalAlpha = 0.5;
        this.ctx_boxes.lineWidth="2";
        for(var color_n=0; color_n<this.class_colors.length;color_n++){
            if(locations_by_color.length > 0){
                this.ctx_boxes.strokeStyle = this.class_colors[color_n];
                for(let ltrb of locations_by_color[color_n]){
                        this.ctx_boxes.strokeRect(ltrb[0], ltrb[1], ltrb[2]-ltrb[0], ltrb[3]-ltrb[1]);
                }
            }
        }
        this.ctx_boxes.globalAlpha = 1.0;
        this.ctx_boxes.strokeStyle = "black";
        this.ctx_boxes.fillStyle = "black";
        this.ctx_boxes.font = self.config.caption_font;
        this.ctx_boxes.shadowColor = "black";
        this.ctx_boxes.shadowBlur=7;
        this.ctx_boxes.lineWidth=5;
        //this.ctx_boxes.fillStyle = this.config.transcription_font_color;
        for(var n=0;n<this.rect_LTRB.length;n++){
            this.ctx_boxes.strokeText(this.rect_captions[n], this.rect_LTRB[n][0], this.rect_LTRB[n][1]);
        }
        this.ctx_boxes.shadowBlur=0;
        this.ctx_boxes.fillStyle="white";
        for(var n=0;n<this.rect_LTRB.length;n++){
            this.ctx_boxes.fillText(this.rect_captions[n], this.rect_LTRB[n][0], this.rect_LTRB[n][1]);
        }        
    }
    set_active(values){
        /**
         * @param values [int]: values to set active activate. can be empty, values must be integers in the range [0, this.rect_LTRB.legth-1]
         */
        var self = this;
        this.active = values;
        this.draw_active();
        let html_str='<table border="1" width="100%"><tr><th width="auto">#</th><th width="auto">ID</th><th width="auto">Location</th><th width="100%">ClassName</th><th width="auto">Choose</th></tr>'
        for(let n=0;n<values.length;n++){
            let active=values[n];
            //html_str+=("<tr><td>"+n+"</td><td>"+active+"</td><td>"+this.rect_captions[active])+"</td><td>"+this.rect_LTRB[active]+"</td><td>"+this.class_names[this.rect_classes[active]]+'</tb><td><button type="button" id="select_item_'+n+'">Select</button>'+"</td></tr>"
            html_str+=('<tr><td width="auto">'+n+'</td><td width="auto">'+active+'</td><td width="auto">'+this.rect_LTRB[active]+'</td><td width="100%">'+this.class_names[this.rect_classes[active]]+'</tb><td width="auto"><button type="button" id="select_item_'+n+'">Select</button>'+"</td></tr>");
            html_str+=('<tr><td colspan="5" width="100%">'+this.rect_captions[active]+"</td></tr>");
        }
        this.selected_div.innerHTML=html_str+"</table>";
        for(let n=0;n<values.length;n++){
            document.getElementById("select_item_"+n).onclick = function(){
                self.active=[values[n]];
                self.draw_active();
            }
        }
    }
    draw_active(){
        this.ctx_active.clearRect(0, 0, this.img.width, this.img.height);
        if(this.rect_LTRB.length>0 && this.active.length>0){
            for(let active of this.active){
                let ltrb=this.rect_LTRB[active];

                this.ctx_active.beginPath();
                this.ctx_active.lineWidth="8";
                this.ctx_active.strokeStyle="black";
                this.ctx_active.rect(ltrb[0], ltrb[1], ltrb[2]-ltrb[0], ltrb[3]-ltrb[1]);
                this.ctx_active.stroke();

                this.ctx_active.beginPath();
                this.ctx_active.lineWidth="4";
                this.ctx_active.strokeStyle="white";
                this.ctx_active.rect(ltrb[0], ltrb[1], ltrb[2]-ltrb[0], ltrb[3]-ltrb[1]);
                this.ctx_active.stroke();

                this.ctx_active.beginPath();
                this.ctx_active.lineWidth="2";
                this.ctx_active.strokeStyle="black";
                this.ctx_active.rect(ltrb[0], ltrb[1], ltrb[2]-ltrb[0], ltrb[3]-ltrb[1]);
                this.ctx_active.stroke();
            }
        }
    }

    items_at_coordinates(x, y){
        let results=[];
        for(let n = 0; n<this.rect_LTRB.length;n++){
            let ltrb=this.rect_LTRB[n];
            if(ltrb[0]<x && ltrb[2]>x && ltrb[1]<y && ltrb[3]>y){
                results.push(n);
            }
        }
        if(results.length==0){
            return [];
        }else{
            return results;
        }
    }
    
    create_selection(){
        this.selected_div.innerHTML = "Selection Created!"
    }
    create_interactive(){
        this.drag_begin_x=-1;
        this.drag_begin_y=-1;
        var self=this;
       
        function getMousePos(evt) {
            var rect = self.cnv_interactive.getBoundingClientRect();
            var scale = parseFloat(self.canvaces_div.style.zoom);
            if (isNaN(scale)){
                scale=1.0;
            }
            
            const  mouseX=evt.clientX - self.cnv_interactive.offsetLeft;
            const  mouseY=evt.clientY - self.cnv_interactive.offsetTop;
            const scaledX=mouseX / self.canvaces_div.style.width * self.canvaces_div.clientWidth;
            const scaledY=mouseY / self.canvaces_div.style.height * self.canvaces_div.clientHeight;
            dbg_log("Mouse:("+mouseX+", "+mouseY+")          Scaled:("+scaledX+", "+scaledY+")");
            return {
                //x: scaledX,
                //y: scaledY
                x: mouseX,
                y: mouseY

            };
        }
        function getMousePos(evt) {
            var rect = self.cnv_interactive.getBoundingClientRect();
            var scale = parseFloat(self.canvaces_div.style.zoom);
            if (isNaN(scale)){
                scale=1.0;
            }
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }
        function getMousePos(evt) {
            var rect = self.cnv_interactive.getBoundingClientRect();
            var scale = parseFloat(self.canvaces_div.style.zoom);
            if (isNaN(scale)){
                scale=1.0;
            }
            const res= {
                x: (evt.clientX - rect.left),
                y: (evt.clientY - rect.top)
            };
            //dbg_log("Returning "+JSON.stringify(res));
            return res;
        }
        this.cnv_interactive.addEventListener('mousedown', function(evt) {
            var mousePos = getMousePos(evt);
            //let key = evt.key.toLowerCase();
            //if(key=="shift"){
            //    self.ctx_interactive.fillStyle = "rgba(255, 0, 0, 0.5)";
            //}else if(key==""){
            //    self.ctx_interactive.fillStyle = "rgba(0, 0, 0, 0.5)";
            //}
            if(evt.ctrlKey){
                if(self.active.length==0){
                    self.drag_begin_x = -1;
                    self.drag_begin_y = -1;

                }else{
                    self.drag_begin_x=mousePos.x;
                    self.drag_begin_y=mousePos.y;
                }
                self.ctx_interactive.fillStyle = "rgba(255, 0, 0, 0.5)";
                self.mouse_mode="subtract";
            }else if(evt.shiftKey){
                self.ctx_interactive.fillStyle = "rgba(0, 255, 0, 0.5)";
                self.drag_begin_x=mousePos.x;
                self.drag_begin_y=mousePos.y;
                self.mouse_mode="add";
            }else{
                self.ctx_interactive.fillStyle = "rgba(0, 0, 0, 0.5)";
                self.drag_begin_x=mousePos.x;
                self.drag_begin_y=mousePos.y;
                self.mouse_mode="new";
            }
        }, false);

        this.cnv_interactive.addEventListener('mouseup', function(evt) {
            var mousePos = getMousePos(evt);
            var l=Math.round(Math.min(mousePos.x,self.drag_begin_x));
            var t=Math.round(Math.min(mousePos.y,self.drag_begin_y));
            var r=Math.round(Math.max(mousePos.x,self.drag_begin_x));
            var b=Math.round(Math.max(mousePos.y,self.drag_begin_y));
            if(self.mouse_mode=="subtract"){
                if(l>=0 || t>=0){
                    self.subtract_rectangle_from_selected([l,t,r,b]);
                    self.set_active(self.active);
                }else{
                    ui_warn("Invalid subtract");
                }
            }else if(self.mouse_mode=="add"){
                if((r-l)*(b-t)>25 && l>=0 && t>=0 && r < self.img.width && b< self.img.height){ // area selected
                    dbg_log("ADD:"+[l,t,r,b]+":"+self.getindexes_inside_rectangle([l,t,r,b]));
                    self.active = self.active.concat(self.getindexes_inside_rectangle([l,t,r,b]));
                }else{ // single click
                    dbg_log("ADD<>:"+[l,t,r,b]+":"+self.items_at_coordinates((l+r)/2,(t+b)/2));
                    self.active = self.active.concat(self.items_at_coordinates((l+r)/2,(t+b)/2));
                }
                self.set_active(self.active);
            }else if(self.mouse_mode == "new"){
                if((r-l)*(b-t)>25 && l>=0 && t>=0 && r < self.img.width && b< self.img.height){ // area selected
                    self.rect_captions.push("");
                    self.rect_classes.push(self.class_selection_ui.selection);
                    self.active=[self.rect_LTRB.push([l,t,r,b])-1];
                    self.draw_boxes();
                    self.set_active(self.active);
                }else{
                    self.active = self.items_at_coordinates((l+r)/2,(t+b)/2);
                    self.set_active(self.active);
                }
            }else{
                ui_warn("unknown state");
            }
            self.drag_begin_x=-1;
            self.drag_begin_y=-1;
            self.ctx_interactive.clearRect(0,0,self.img.width,self.img.height);
        }, false);
        this.cnv_interactive.addEventListener('mousemove', function(evt) {
            var mousePos = getMousePos(evt);
            if (self.drag_begin_x>0 && self.drag_begin_y>0){
                self.ctx_interactive.clearRect(0,0,self.img.width,self.img.height);
                self.ctx_interactive.fillRect(self.drag_begin_x,self.drag_begin_y,mousePos.x-self.drag_begin_x,mousePos.y-self.drag_begin_y);
            }
        }, false);
    }
    create_config(){
        this.config_div.innerHTML='<table><tr><td id="user_name">totos</td></tr></table>'
    }
    create_navigation(){
        this.navigation_div.innerHTML="Navigation Loading";
        var self=this;
        var xhr = new XMLHttpRequest();
        let url="/page_id_list.json";
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = function() {
          var status = xhr.status;
          if (status === 200) {
            //callback(null, xhr.response);
            ui_warn("Reloading gt! Responce: '"+JSON.stringify(xhr.response)+"'");
            //data=JSON.parse(xhr.response);
            let tbl_nav=document.createElement("table");
            let tr_nav=document.createElement("tr");
            self.page_links=[]
            for(let page_id of xhr.response){
                let td_page=document.createElement("td")
                let a_page=document.createElement("a")
                a_page.href='/'+page_id+'.html'
                a_page.innerHTML='<img src="/'+page_id+'.thumb.png" height="100px" />'
                td_page.appendChild(a_page);
                tr_nav.appendChild(td_page);
                self.page_links.push(a_page);
                if(page_id==self.page_id){
                    this.current_page_link=a_page
                }
            }
            tbl_nav.appendChild(tr_nav)
            self.navigation_div.innerHTML='';
            self.navigation_div.appendChild(tbl_nav);

          } else {
            ui_warn("Reloading gt failed status:"+status+" responce:'"+xhr.response+"'");
          }
        };
        xhr.send();
    }

    create_canvaces(){
        let width=1000;
        let height=1000;
        //this.img = new Image(width, height);
        this.img = new Image();
        this.canvaces_div.innerHTML ="";
        //this.canvaces_div.style.borderStyle = "solid";
        //this.canvaces_div.style.overflow = "scroll"
        //this.canvaces_div.style.position = "relative";
        //this.canvaces_div.style.width = width;
        //this.canvaces_div.style.height = height;

        this.cnv_image = document.createElement("canvas");
        this.cnv_image.innerHTML = "This text is displayed because your browser does not support HTML5 Canvas.";
        this.cnv_image.style.zIndex=1;
        this.cnv_image.style.position = "absolute";
        this.cnv_image.style.left = 0;
        this.cnv_image.style.top = 0;
        this.cnv_image.style.height = height;
        this.cnv_image.style.width = width;
        //this.cnv_image.style.background="red";
        this.canvaces_div.appendChild(this.cnv_image);

        this.cnv_boxes = document.createElement("canvas");
        this.cnv_boxes.innerHTML = "This text is displayed because your browser does not support HTML5 Canvas.";
        this.cnv_boxes.style.position = "absolute";
        this.cnv_boxes.style.zIndex=2;    
        this.cnv_boxes.style.left = 0;
        this.cnv_boxes.style.top = 0;
        this.cnv_boxes.style.height = height;
        this.cnv_boxes.style.width = width;
        //this.cnv_boxes.style.background="green";
        this.canvaces_div.appendChild(this.cnv_boxes);

        this.cnv_active = document.createElement("canvas");
        this.cnv_active.innerHTML = "This text is displayed because your browser does not support HTML5 Canvas.";
        this.cnv_active.style.position = "absolute";
        this.cnv_active.style.zIndex=3;    
        this.cnv_active.style.left = 0;
        this.cnv_active.style.top = 0;
        this.cnv_active.style.height = height;
        this.cnv_active.style.width = width;
        //this.cnv_active.style.background="green";
        this.canvaces_div.appendChild(this.cnv_active);

        this.cnv_interactive = document.createElement("canvas");
        this.cnv_interactive.innerHTML = "This text is displayed because your browser does not support HTML5 Canvas.";
        this.cnv_interactive.style.position = "absolute";
        this.cnv_interactive.style.zIndex=4;    
        this.cnv_interactive.style.left = 0;
        this.cnv_interactive.style.top = 0;
        this.cnv_interactive.style.height = height;
        this.cnv_interactive.style.width = width;
        //this.cnv_interactive.style.background="green";
        this.canvaces_div.appendChild(this.cnv_interactive);
    }
}


class ClassIdEditor{
    constructor(values, editor_div_id, selector_div_id){
        this.frat_ui = null;
        var self = this; // For this acces in callbacks

        this.class_names = [];
        this.class_colors = [];        
        for(let i=0;i<values.length;i++){
            this.class_names.push(values[i].name);
            this.class_colors.push(values[i].color);

        }
        this.selection = 0;

        this.dom_editor_div = document.getElementById(editor_div_id);
        this.dom_selector_div = document.getElementById(selector_div_id);
        this.dom_editor_div.innerHTML = "";
        this.dom_edit_tablebody = document.createElement("tbody");
        this.dom_edit_table = document.createElement("table");
        this.dom_edit_table.innerHTML = "<thead><tr><th>Class ID</th><th>Class Caption</th><th>Class Color</th><th></th></tr></thead>";
        this.dom_edit_tablefoot = document.createElement("tfoot");
        
        this.dom_edit_table.appendChild(this.dom_edit_tablebody);
        this.dom_edit_table.appendChild(this.dom_edit_tablefoot);
        this.dom_editor_div.appendChild(this.dom_edit_table);

        this.btn_add = document.createElement("button");
        this.btn_add.innerHTML = "Add Class";
        this.btn_add.onclick = function () {
            let row = document.createElement("tr");
            ClassIdEditor.populate_row(self.dom_edit_tablebody.rows.length, {name:"Change this", color:"#888888"}, row);
            self.dom_edit_tablebody.appendChild(row);
        }
        this.dom_edit_tablefoot.appendChild(this.btn_add);
    
        this.btn_remove = document.createElement("button");
        this.btn_remove.innerHTML = "Remove Last Class";
        this.btn_remove.onclick = function () {
            if(self.dom_edit_tablebody.rows.length > 1){
                self.dom_edit_tablebody.deleteRow(-1);
            }else{
                ui_error("At least one class is required, have "+self.dom_edit_tablebody.rows.length);
            }
        }
        this.dom_edit_tablefoot.appendChild(this.btn_remove);

        this.btn_reset = document.createElement("button");
        this.btn_reset.innerHTML = "Reset";
        this.btn_reset.onclick = function(){
            let values=[];
            for(let i=0;i<self.class_names.length;i++){
                values.push({name:self.class_names[i],color:self.class_colors[i]});
            }
            self.write_gui(values);
        }
        this.dom_edit_tablefoot.appendChild(this.btn_reset);

        this.btn_save = document.createElement("button");
        this.btn_save.innerHTML = "Save";
        this.btn_save.onclick = function(){
            values=self.read_gui();
            if(self.gui_values_ok(values)){
                self.class_names.length = 0;
                self.class_colors.length = 0;
                for(let val of values){
                    self.class_names.push(val.name);
                    self.class_colors.push(val.color);
                }
                self.draw_class_choices();
            }else{
                ui_error("Can not save Class Ids");
            }
        }
        this.dom_edit_tablefoot.appendChild(this.btn_save);
        this.draw_class_choices();
    }

    static populate_row(row_num, values_object,rowNode){  //  staticmethod
        let inpId = document.createElement("input");
        inpId.type="text";
        inpId.value=row_num;
        inpId.disabled=1
        let tdClassId = document.createElement("td");
        tdClassId.appendChild(inpId);

        let inpName = document.createElement("input");
        inpName.type="text";
        inpName.value=values_object.name;
        let tdClassName = document.createElement("td");
        tdClassName.appendChild(inpName);

        let inpColor = document.createElement("input");
        inpColor.type = "color";
        inpColor.value = values_object.color;
        let tdClassColor = document.createElement("td");
        tdClassColor.appendChild(inpColor);

        rowNode.appendChild(tdClassId);
        rowNode.appendChild(tdClassName);
        rowNode.appendChild(tdClassColor);
    };

    read_gui(){
        var res=[];
        for(let row of this.dom_edit_tablebody.children){
            res.push({name:row.children[1].children[0].value.trim(), color: row.children[2].children[0].value.trim()});
        }
        return res;
    }

    write_gui(class_label_values){
        this.dom_edit_tablebody.innerHTML = "";
        for(const row_values of class_label_values){
            let rowNode = document.createElement("tr");
            ClassIdEditor.populate_row(this.dom_edit_tablebody.rows.length, row_values, rowNode);
            this.dom_edit_tablebody.appendChild(rowNode);
        }
    }

    gui_values_ok(values){
        let names = new Set();
        let colors = new Set();
        for(let i=0; i < values.length; i++){
            if(values[i].name==""){
                ui_error("gui_values_ok: Empty name");
                return 0;
            }
            names.add(values[i].name);
            colors.add(values[i].color);
        }
        if((names.size!=values.length) ||(names.size!=colors.size)){
            ui_error("gui_values_ok: Sizes:"+values.length+","+names.size+","+colors.size);
            return 0;
        }
        return 1;
    }

    set_choice(choice){
        this.selection = choice;
        for(let i=0;i<this.class_buttons.length;i++){
            this.class_buttons[i].disabled = (i==choice);
        }
        if(this.frat_ui===null){
            ui_warn("set_choice: FratUI unlinked")
        }else{
            this.frat_ui.set_selection_class(this.selection);
        }
    }

    draw_class_choices(){
        var self=this;
        if (this.selection >= this.class_names.colors){
            this.selection=0;
        }
        this.dom_selector_div.innerHTML = "";
        this.class_buttons=[];
        let dom_select_table = document.createElement("table");
        let dom_selet_row = document.createElement("tr");
        for(let i=0;i<this.class_names.length;i++){
            let btn_num = i;
            let dom_td = document.createElement("td");
            let dom_btn = document.createElement("button");
            dom_btn.type="button";
            dom_btn.id = "class_choice_"+i;
            dom_btn.innerHTML = this.class_names[i];
            //dom_btn.style.background = this.class_colors[i];
            //dom_btn.style.textShadow = "0px 0px 4px #666666,0px 0px 2px #FFFFFF";
            dom_btn.style.textShadow = "0px 0px 3px "+this.class_colors[i];
            //dom_btn.style.borderRadius = "5px";
            dom_btn.onclick = function (){
                self.set_choice(btn_num);
            }
            dom_td.appendChild(dom_btn);
            dom_selet_row.appendChild(dom_td);
            this.class_buttons.push(dom_btn);
        }
        dom_select_table.appendChild(dom_selet_row);
        this.dom_selector_div.appendChild(dom_select_table);
        this.set_choice(this.selection);
    }
}