class Canvaces{
    constructor(class_selection, canvaces_divid, selected_divid, img_url, gt_json, classes_json, config){
        this.class_selection_ui = class_selection
        this.config = config;
        this.config={caption_font:"18pt Calibri",
                    shortcut_code_next: "n",
                    shortcut_code_previous: "shift+n",
                    shortcut_code_delete: "delete"
                }
        var self = this;
        
        this.active = [];
        this.set_classes(classes_json);
        this.set_boxes(gt_json);
        this.canvaces_div = document.getElementById(canvaces_divid);
        this.selected_div = document.getElementById(selected_divid);
        this.create_canvaces();
        this.create_interactive();
        
        this.img = new Image();
        this.img.onload = function(){
            self.initialise_from_image();
        }
        this.img.src = img_url;

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
        self.draw_boxes();
        self.create_selection();
        self.draw_active();
        self.add_keylisteners();
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
                case "alt+alt":
                case "ctrl+ctrl":
                case "shift+shift":
                    break;
                case self.config.shortcut_code_next:
                    if(self.active.length==1){
                        self.set_active([(self.active+1)%self.rect_LTRB.length]);
                    } else if(self.active.length==0 && self.rect_LTRB.length>0){
                        self.set_active([0]);
                    }
                    break;
                case self.config.shortcut_code_previous:
                    if(self.active.length==1){
                        self.set_active([(self.active-1+self.rect_LTRB.length)%self.rect_LTRB.length]);
                    } else if(self.active.length==0 && self.rect_LTRB.length>0){
                        self.set_active([0]);
                    }
                    break;
                case self.config.shortcut_code_delete:
                    self.delete_active();
                    break;
    
                default:
                    alert("Unknown code:"+shortcut);
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
    delete_active(){
        if(this.active.length>0){
            alert("TODO delete active");
        }
    }

    set_boxes(boxes_json){
        this.rect_LTRB=[];
        this.rect_captions=[];
        this.rect_classes=[];
        for(let box of JSON.parse(boxes_json)){
            this.rect_LTRB.push(box.ltrb);
            this.rect_captions.push(box.transcription);
            this.rect_classes.push(box.class_id);
        }
        this.sort_boxes();
    }
    set_classes(classes_json){
        let values=JSON.parse(classes_json);
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
        this.active = values;
        this.draw_active();
        let html_str="<table border=1><tr><th>#</th><th>ID</th><th>Caption</th><th>Location</th><th>ClassName</th></tr>"
        for(let n=0;n<values.length;n++){
            let active=values[n];
            html_str+=("<tr><td>"+n+"</td><td>"+active+"</td><td>"+this.rect_captions[active])+"</td><td>"+this.rect_LTRB[active]+"</td><td>"+this.class_names[this.rect_classes[active]]+"</td></tr>"
        }
        this.selected_div.innerHTML=html_str+"</table>";
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
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }
        this.cnv_interactive.addEventListener('mousedown', function(evt) {
            var mousePos = getMousePos(evt);
            self.drag_begin_x=mousePos.x;
            self.drag_begin_y=mousePos.y;
            //alert("X:"+self.drag_begin_x+"   Y:"+self.drag_begin_y)
        }, false);
        this.cnv_interactive.addEventListener('mouseup', function(evt) {
            var mousePos = getMousePos(evt);
            var l=Math.round(Math.min(mousePos.x,self.drag_begin_x));
            var t=Math.round(Math.min(mousePos.y,self.drag_begin_y));
            var r=Math.round(Math.max(mousePos.x,self.drag_begin_x));
            var b=Math.round(Math.max(mousePos.y,self.drag_begin_y));
            if((r-l)*(b-t)>25){
                self.rect_captions.push("");
                self.rect_classes.push(self.class_selection_ui.selection);
                self.active=[self.rect_LTRB.push([l,t,r,b])-1];
                self.draw_boxes();
                self.draw_active();
                console.warn("Added!");
            }else{
                self.set_active(self.items_at_coordinates((l+r)/2,(t+b)/2));
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
    
    create_canvaces(){
        let width=400;
        let height=300;
        this.canvaces_div.innerHTML ="";
        this.canvaces_div.style.borderStyle = "solid";
        this.canvaces_div.style.position = "relative";
        this.canvaces_div.style.width = width;
        this.canvaces_div.style.height = height;

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
                alert("At least one class is required, have "+self.dom_edit_tablebody.rows.length);
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
                alert("Can not save Class Ids");
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
                alert("Empty name");
                return 0;
            }
            names.add(values[i].name);
            colors.add(values[i].color);
        }
        if((names.size!=values.length) ||(names.size!=colors.size)){
            alert("Sizes:"+values.length+","+names.size+","+colors.size);
            return 0;
        }
        return 1;
    }

    set_choice(choice){
        this.selection = choice;
        for(let i=0;i<this.class_buttons.length;i++){
            this.class_buttons[i].disabled = (i==choice);
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