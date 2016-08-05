(function(){
"use strict"
var width = 840;

var SingleTrig = function(div,x,w,h,a,c,p,frames) {
	/*
		Diagram involving a single circle.
		x: center of circle. w,h: svg dimensions.
		a,c,p = amplitude, cycles and phase of circle.
			(--> draw: a*sin(cx+p))
		frames = number of frames per cycle.
	*/
	// this._div	= div;
	this._x 		= x;
	this._y 		= h/2;
	this._w			= w;
	this._h 		= h;
	this._a			= a;
	this._c			= c;
	this._p			= p;
	this._frames	= frames;
	this._tickmax	= frames; // separate copy of frames to allow updating

	this._xs; // set of x coords of tracer
	this._ys; // set of y coords of tracer

	this.animating	= false;
	this.tick 		= 0;
	this.framelength= 100/6; //60fps

	this.plotoffset	= 200;  
	this.plotlength	= w-x-30;
	
	this._calculate();

	this.svg = d3.select(div).insert("svg",":first-child")
		.attr("width",w)
		.attr("height",h);
	//the main circle
	this._circle = this.svg.append("circle")
		.attr("cx",this._x)
		.attr("cy",this._y)
		.attr("r",this._a);
	//small circle indicating current position on circle
	this._tracer = this.svg.append("circle")
 		.attr("cx",this._xs[this.tick])
		.attr("cy",this._ys[this.tick])
		.attr("r",4)
		.style("fill","black");
	//line connecting tracer to origin
	this._line_r = this.svg.append("line")
		.attr("x1",this._x)
		.attr("y1",this._y)
		.attr("x2",this._xs[this.tick])
		.attr("y2",this._ys[this.tick]);
	//line indicating the starting phase
	this._line_zero = this.svg.append("line")
		.attr("x1",this._x)
		.attr("y1",this._y)
		.attr("x2",this._xs[0])
		.attr("y2",this._ys[0]);
	//inner arc indicating angle elapsed
	this._arcfunc = d3.svg.arc()
	    .innerRadius(0)
	    .outerRadius(this._a/10)
	    .startAngle(Math.PI/2-this._p)
	    .endAngle(Math.PI/2-this._p);
    this._arcpath = this.svg.append("path")
	    .attr("d",this._arcfunc)
	    .attr("transform", "translate("+this._x+","+this._y+")")
	    .style("fill","blue")
	    .style("opacity","0.5");
    this._arctxt = this.svg.append("text")
    	.attr("x",this._x+2)
    	.attr("y",this._y-10)
    	.text("")
    	.style("fill","steelblue");

    this._xscale = d3.scale.linear()
	    .domain([0,this._tickmax])
		.range([this._x+this.plotoffset,this._x+this.plotlength]);

    this._plot = this.svg.append("g");

	this._graphfunc = d3.svg.line()
		.x(function(d,i){return this._xscale(i);})
		.y(function(d){return d;})
		.interpolate("basis");

	this._graph = this._plot.append("path")
		.classed("graph",true);

	//line following the current x value
	this._line_y = this.svg.append("line")
		.attr("x1",this._xs[0])
		.attr("y1",this._ys[0])
		.attr("x2",this._xscale(0))
		.attr("y2",this._ys[0])
		.style("opacity","0");
	//line following the current y value
	this._line_x = this.svg.append("line")
		.attr("x1",this._xscale(0))
		.attr("y1",this._y)
		.attr("x2",this._xscale(0))
		.attr("y2",this._ys[0])
		.style("stroke","steelblue")
		.style("opacity","0");
	//x-axis for plot
	this._axis_x = this.svg.append("line")
		.attr("x1",this._xscale(0))
		.attr("y1",this._y)
		.attr("x2",this._xscale(this._tickmax))
		.attr("y2",this._y);

	this._axistxt = [];

	for (var i=0.5; i<=2; i+=0.5){
		this._axistxt.push(
			this.svg.append("text")
	    	.attr("x",this._xscale(Math.round(i*this._tickmax)/2))
	    	.attr("y",this._y+20)
	    	.text(i+"\u03C0")
	    	.style("fill","darkred")
	    	.style("text-anchor","middle")
	    	.style("opacity","0")
		);
	}

	//set up onclick events
	var that = this;
	this.svg.on("click",function(){
		that.animating=!that.animating;
		if(that.animating){that._animate();}
	})

	if(this.animating){this._animate();}
};
SingleTrig.prototype.rebuild = function() {
	//Rebuild the image using new a,c,p,f etc...
	this.animating = false;
	this.tick=0;
	this._tickmax = this._frames;
	this._calculate();

	this._circle.attr("r",this._a);
	this._line_zero
		.attr("x2",this._xs[0])
		.attr("y2",this._ys[0]);
	this._line_r
		.attr("x2",this._xs[0])
		.attr("y2",this._ys[0]);
	this._tracer
		.attr("cx",this._xs[0])
		.attr("cy",this._ys[0]);
	this._arcfunc
	    .startAngle(Math.PI/2-this._p)
	    .endAngle(Math.PI/2-this._p);
	this._xscale.domain([0,this._tickmax])
		.range([this._x+this.plotoffset,this._x+this.plotlength]);
};
SingleTrig.prototype._animate = function() {
	var that = this;
	setTimeout(function(){
		that.update();
	},this.framelength);
};
SingleTrig.prototype.update = function() {
	if(!this.animating){return;}

	if(this.tick===0){//first frame
		this._line_x.style("opacity",1);
		this._line_y.style("opacity",1);
		this._axistxt[0].style("opacity","0");
		this._axistxt[1].style("opacity","0");
		this._axistxt[2].style("opacity","0");
		this._axistxt[3].style("opacity","0");
	}
	else if (this.tick===Math.floor(this._tickmax/4)){
		this._axistxt[0].style("opacity","1");
	}
	else if (this.tick===Math.floor(this._tickmax/2)){
		this._axistxt[1].style("opacity","1");
	}
	else if (this.tick===Math.floor(3*this._tickmax/4)){
		this._axistxt[2].style("opacity","1");
	}
	else if(this.tick>=this._tickmax) {
		this.tick = 0; 
		this.animating = false;

		this._axistxt[3].style("opacity","1");
		this._line_x.style("opacity",0);
		this._line_y.style("opacity",0);

		return;
	}
	this.tick++;
	this._tracer
		.attr("cx",this._xs[this.tick])
		.attr("cy",this._ys[this.tick]);

	this._line_r
		.attr("x2",this._xs[this.tick])
		.attr("y2",this._ys[this.tick])

	var ang = this.tick*2*this._c*Math.PI/this._tickmax;
	this._arctxt.text((ang/Math.PI).toFixed(1)+"\u03C0");
	this._arcfunc.endAngle(Math.PI/2-ang-this._p);
	this._arcpath.attr("d",this._arcfunc);

	this._line_y
		.attr("x1",this._xs[this.tick])
		.attr("y1",this._ys[this.tick])
		.attr("x2",this._xscale(this.tick))
		.attr("y2",this._ys[this.tick]);

	this._line_x
		.attr("x1",this._xscale(this.tick))
		.attr("x2",this._xscale(this.tick))
		.attr("y2",this._ys[this.tick]);

	this._graph.attr("d",this._graphfunc(this._ys.slice(0,this.tick+1)));
	
	this._animate();
};
SingleTrig.prototype._calculate = function(){
	this._xs = [];
	this._ys = [];
	// console.log("building...");

	for (var i=0; i<=this._tickmax; i++){
		this._xs.push(
			this._x+this._a*Math.cos(this._p+2*Math.PI*this._c*i/this._tickmax));
		this._ys.push(
			this._y-this._a*Math.sin(this._p+2*Math.PI*this._c*i/this._tickmax));
	}
};
SingleTrig.prototype.setAmp = function(a){
	//not visible until rebuilt
	this._a = a;
};
SingleTrig.prototype.setCycle = function(c){
	//not visible until rebuilt
	this._c = c;
};
SingleTrig.prototype.setPhase = function(p){
	//not visible until rebuilt
	this._p = p;
};
SingleTrig.prototype.setFrames = function(f) {
	//not visible until rebuilt
	this._frames = f;
};


var MultiTrig = function(div,x,w,h,a,c,p,frames,terms) {
	/*
		Diagram involving sum of circles.
		x: center of circle. w,h: svg dimensions.
		a,c,p = *ARRAYS* of amplitudes, cycles and phases of circles.
			(--> draw: a*sin(cx+p))
		frames = number of frames per cycle.
	*/
	this._x 		= x;
	this._y 		= h/2;
	this._w			= w;
	this._h 		= h;
	this._a			= a;
	this._c			= c;
	this._p			= p;
	this._frames	= frames;
	this._tickmax	= frames; // separate copy of frames to allow updating

	this._xs; // set of x coords of tracer
	this._ys; // set of y coords of tracer

	this._waitframe = false;
	this.animating	= false;
	this.tick 		= 0;
	this.framelength= 100/6; //60fps

	this.plotoffset	= 200;  
	this.plotlength	= w-x-100;
	//new:
	this._terms = typeof terms === "undefined"? a.length: terms; //no. of terms in series
	this._pos; //set of each x and y for each circle
	this._scan = false;
	this._scan_ys;

	var that = this;

	this._calculate();

	this.svg = d3.select(div).insert("svg",":first-child")
		.attr("width",w)
		.attr("height",h);

	this._circleGroup = this.svg.append("g");

	this._circles = this._circleGroup.selectAll("circle")
	.data(this._a.slice(0,this._terms)).enter().append("circle")
		.attr("cx",function(d,i){return that._pos.x[i][that.tick];})
		.attr("cy",function(d,i){return that._pos.y[i][that.tick];})
		.attr("r",function(d){return Math.abs(d);});

	this._tracer = this.svg.append("circle")
 		.attr("cx",this._xs[this.tick])
		.attr("cy",this._ys[this.tick])
		.attr("r",4)
		.style("fill","black");

	this._line_y = this.svg.append("line");

	this._xscale = d3.scale.linear()
	    .domain([0,this._tickmax])
		.range([this._x+this.plotoffset,this._x+this.plotlength]);

    this._plot = this.svg.append("g");

	this._graphfunc = d3.svg.line()
		.x(function(d,i){return this._xscale(i);})
		.y(function(d){return d;})
		.interpolate("basis");
	this._graph = this._plot.append("path")
		.classed("graph",true);


	//set up onclick events
	this.svg.on("click",function(){
		that.animating=!that.animating;
		if(that.animating){that._animate();}
	})

	if(this.animating){this._animate();}
};
MultiTrig.prototype._calculate = function(){
	this._pos = {x:[],y:[]};
	for(var i=0; i<=this._terms; i++){
		this._pos.x.push([]);
		this._pos.y.push([]);
		for (var j=0; j<=this._tickmax;j++){
			var x = this._x;
			var y = this._y;
			for(var k=0; k<i; k++){	
				x+=this._a[k]*Math.cos(this._p[k]+2*Math.PI*this._c[k]*j/this._tickmax);
				y-=this._a[k]*Math.sin(this._p[k]+2*Math.PI*this._c[k]*j/this._tickmax);
			}
			this._pos.x[i].push(x);
			this._pos.y[i].push(y);
		}
	}
	this._xs = this._pos.x[this._terms];
	this._ys = this._pos.y[this._terms];
	this._scan_ys = this._ys.slice(0,-1);
};

MultiTrig.prototype._animate = function() {
	var that = this;
	if(!this._waitframe){
		this._waitframe=true; //prevent overlapping animation calls.
		setTimeout(function(){
			that._waitframe=false;
			that.update();
		},this.framelength);
	}
};
MultiTrig.prototype.update = function() {
	if(!this.animating){return;}
	var that=this;
	

	
	if (this._scan){
		if(this.tick>=this._tickmax) {//final frame
			this.tick = 0;
		}
		this._line_y.attr("x2",this._xscale(0))//*
		this._graph.attr("d",this._graphfunc(this._scan_ys));

		this._scan_ys.push(this._scan_ys.shift())
	}
	else{
		if(this.tick>this._tickmax) {//final frame
			this.tick = 0; 
			this.animating = false;
			return;
		}
		this._line_y.attr("x2",this._xscale(this.tick));

		this._graph.attr("d",this._graphfunc(this._ys.slice(0,this.tick+1)));
	}
	
	this._circles
		.attr("cx",function(d,i){return that._pos.x[i][that.tick]})
		.attr("cy",function(d,i){return that._pos.y[i][that.tick]});
	this._tracer
		.attr("cx",this._xs[this.tick])
		.attr("cy",this._ys[this.tick]);

	this._line_y
		.attr("x1",this._xs[this.tick])
		.attr("y1",this._ys[this.tick])
		.attr("y2",this._ys[this.tick]);

	this.tick++;
	this._animate();
};
MultiTrig.prototype.rebuild = function() {
	this.tick = 0;
	this._calculate();

	var that = this;
	this._circles = this._circleGroup.selectAll("circle").data(this._a.slice(0,this._terms));

	this._circles.enter().append("circle")
		.attr("cx",function(d,i){return that._pos.x[i][that.tick];})
		.attr("cy",function(d,i){return that._pos.y[i][that.tick];})
		.attr("r",function(d){return Math.abs(d);})
	this._circles.exit().remove();

	this._tracer
		.attr("cx",this._xs[this.tick])
		.attr("cy",this._ys[this.tick]);	
};
MultiTrig.prototype.setTerms = function(t){
	this._terms = t;

	this.rebuild();
	
};
MultiTrig.prototype.setFrames = function(f) {
	this._frames = f;
	this._tickmax = f;
	this.rebuild();
};
MultiTrig.prototype.setScanning = function(bool){
	this.tick = 0;
	this._scan = bool;
	this.animating = bool;
	this._scan_ys = this._ys.slice(0,-1);
	if(this.animating){this._animate();}
};

var TravelTrig = function(div,x,w,h,a,c,k,p,atoms,maxtick,drawAtoms,drawPath) {
	/*
		Diagrams involving a string of atoms, each with a time varying height
		described by a sum of circles.
		Position of atom at (x,t): = a[0]*sin(k[0]x+c[0]t+p[0]) + a[1]...
		
		x: center of first atom. w-x = center of final atom.
		w,h: svg dimensions.
		a,c,p = *ARRAYS* of amplitudes, cycles and phases of circles.
			(--> draw: a*sin(cx+p))
		frames = number of frames per cycle.
	*/
	var that = this;

	this._x 		= x; 
	this._y 		= h/2;
	this._w			= w;
	this._h 		= h;
	this._a			= a;
	this._c			= c;
	this._p			= p;
	this._k 		= k;

	this._maxtick 	= maxtick; //number of ticks, per atom.
	this._ticksep = 2;
	
	this._waitframe = false;
	this.animating	= false;
	this.tick 		= 0;
	this.framelength= 100/6; //60fps

	this.activeAtom = 0; //currently highlighted atom.
	this._atom_count = atoms;
	this._atomsep;
	this._atom_x; //set of x positions for the atoms
	this._atom_y; //set of y positions for the atoms
	this._triggerwidth;

	this._drawatoms 	= false;
	this._drawpath		= false;
	this._drawcircles	= false;
	this._terms = a.length;

	//calc
	this._calculate()
	//
	this.svg = d3.select(div).insert("svg",":first-child")
		.attr("width",w)
		.attr("height",h);
	this.svg.append("line")
		.attr("x1",this._x)
		.attr("y1",this._y)
		.attr("x2",this._w-this._x)
		.attr("y2",this._y);
	
	this._atomsGroup = this.svg.append("g");

	this._atoms = this._atomsGroup.selectAll("circle").data(this._atom_x)
	.enter().append("circle")
		.attr("cx",function(d,i){return d;})
		.attr("cy",function(d,i){return that._ys[i][that.tick];})
		.attr("r",10)
		.style("fill","#ff2222");

	this._atom_triggers = this._atomsGroup.selectAll("rect").data(this._atom_x)
	.enter().append("rect")
		.attr("height",h)
		.attr("width",this._triggerwidth)
		.attr("x",function(d){
			return d-that._triggerwidth/2;})
		.attr("y",10)
		.on("mouseenter",function(d,i){
			that.highlight(i);
		})
		.style("opacity","0");

	this._circleGroup = this.svg.append("g");

	this._circles = this._circleGroup.selectAll("circle")
	.data(this._a.slice()).enter().append("circle")
		.attr("cx",function(d,i){return that._atom_x[that.activeAtom]
			+that._pos[that.activeAtom].x[i][that.tick];})
		.attr("cy",function(d,i){return that._pos[that.activeAtom].y[i][that.tick];})
		.attr("r",function(d){return Math.abs(d);})
		.style("opacity","0.5");

	this._tracer = this.svg.append("circle")
 		.attr("cx",this._xs[this.activeAtom][this.tick])
		.attr("cy",this._ys[this.activeAtom][this.tick])
		.attr("r",4)
		.style("fill","black");

	this._line_y = this.svg.append("line");

	this._plot = this.svg.append("g");

	this._graphfunc = d3.svg.line()
		.x(function(d,i){
			return this._atom_x[i];})
		.y(function(d){return d;})
		.interpolate("basis");

	this._graph = this._plot.append("path")
		.classed("graph",true);
	this._graph.attr("d",this._graphfunc(this._scan_ys[this.tick]));

	if(!this._drawatoms) this._atoms.style("display","none");
	if(!this._drawcircles){
		this._circleGroup.style("display","none");
		this._line_y.style("display","none");
		this._tracer.style("display","none");
	}
	if(!this._drawpath) this._graph.style("display","none");

	this.svg.on("click",function(){
		that.animating=!that.animating;
		if(that.animating) that._animate();
	})
	// this.animating=true;
	if(this.animating) this._animate();
};

TravelTrig.prototype._calculate = function() {

	//atom positions:

	var sep = this._atom_count>0? (this._w-2*this._x)/(this._atom_count-1): 1;
	this._atom_x = [];
	this._atom_y = [];
	this._scan_ys = [];
	this._triggerwidth = sep;
	for (var i=0; i<this._atom_count; i++){
		this._atom_x.push(this._x+i*sep);
	}
	//circle positions:
	this._pos = [];
	this._xs = [];
	this._ys = [];
	for (var a=0; a<this._atom_count; a++){// for each atom
		this._pos.push({x:[],y:[]})
		for(var i=0; i<=this._terms; i++){ //for each circle
			this._pos[a].x.push([]);
			this._pos[a].y.push([]);
			for (var j=0; j<=this._maxtick;j++){ // for each time
				var x = 0; //circles to be drawn relative to atoms now.
				var y = this._y;
				for(var k=0; k<i; k++){ // for each
					x+=this._a[k]*Math.cos(this._p[k]+2*Math.PI*(this._c[k]*j/this._maxtick
						+this._k[k]*(this._atom_x[a]-this._x)/(this._w-2*this._x)));
					y-=this._a[k]*Math.sin(this._p[k]+2*Math.PI*(this._c[k]*j/this._maxtick
						+this._k[k]*(this._atom_x[a]-this._x)/(this._w-2*this._x)));
				}
				this._pos[a].x[i].push(x);
				this._pos[a].y[i].push(y);
			}
		}
		this._xs.push(this._pos[a].x[this._terms]);
		this._ys.push(this._pos[a].y[this._terms]);
	}
	this._scan_ys = [];
	for (var j=0; j<=this._maxtick; j++){
		this._scan_ys.push([]);
		for (var a=0; a<this._atom_count; a++){
			this._scan_ys[j].push(this._ys[a][j]);
		}
	}
};

TravelTrig.prototype._animate = function() {
	var that = this;
	if(!this._waitframe){
		this._waitframe=true; //prevent overlapping animation calls.
		setTimeout(function(){
			that._waitframe=false;
			that.update();
		},this.framelength);
	}
};
TravelTrig.prototype.update = function() {
	if(!this.animating){return;}
	var that=this;

	if(this.tick>=this._maxtick) {
			this.tick = 0; 
	}
	
	if (this._drawcircles){
		this.updateCircles();
	}
	if (this._drawatoms){
		this._atoms
			.attr("cy",function(d,i){return that._ys[i][that.tick];});
		}
	if (this._drawpath){
		this._graph.attr("d",this._graphfunc(this._scan_ys[this.tick]));
		}

	this.tick++;
	this._animate();
};
TravelTrig.prototype.updateCircles = function() {
	// separate function to allow calling when not animating
	var that = this;
	this._circles
		.attr("cx",function(d,i){
			return that._atom_x[that.activeAtom]
			+that._pos[that.activeAtom].x[i][that.tick];
			})
		.attr("cy",function(d,i){return that._pos[that.activeAtom].y[i][that.tick];});

	this._line_y
		.attr("y1",this._ys[this.activeAtom][this.tick])
		.attr("x2",that._atom_x[that.activeAtom]
			+that._pos[that.activeAtom].x[this._a.length][this.tick])
		.attr("y2",this._ys[this.activeAtom][this.tick]);
	this._tracer
		.attr("cx",that._atom_x[that.activeAtom]
			+that._pos[that.activeAtom].x[this._a.length][this.tick])
		.attr("cy",this._ys[this.activeAtom][this.tick]);
};
TravelTrig.prototype.toggleAtoms = function(on) {
	if(typeof on === "undefined") on = !this._drawatoms;
	this._drawatoms=on
	if(this._drawatoms){
		this._atoms.style("display","inline");
	}else{
		this._atoms.style("display","none");
	}
};
TravelTrig.prototype.togglePath = function(on) {
	if(typeof on === "undefined") on = !this._drawpath;
	this._drawpath=on;
	if(this._drawpath){
		this._graph.style("display","inline");
	}else{
		this._graph.style("display","none");
	}
};
TravelTrig.prototype.toggleCircles = function(on) {
	if(typeof on === "undefined") on = !this._drawcircles;
	this._drawcircles=on;
	if(this._drawcircles){
		this._circleGroup.style("display","inline");
		this._line_y.style("display","inline");
		this._tracer.style("display","inline");
	}else{
		this._circleGroup.style("display","none");
		this._line_y.style("display","none");
		this._tracer.style("display","none");
	}
};
TravelTrig.prototype.highlight = function(atomid) {
	//unhighlight
		d3.select(this._atoms[0][this.activeAtom]).style("fill","#ff2222")
	//highlight
	if (atomid<this._atoms[0].length){
		this.activeAtom = atomid;
		d3.select(this._atoms[0][this.activeAtom]).style("fill","orange");
		this._line_y.attr("x1",this._atom_x[this.activeAtom]);
		this.updateCircles();
	}
};
//--<testing>--

var Slideshow = function(div){

	this.autoplay = false; //auto play next animation on slide *change*
	// array of functions to call after setting a new active slide
	this.setActiveExtra = []; 

	this._div = div;
	this._buttons = {};
	this._sliders = {};
	this._captions 	= [];
	this._slides 	= [];
	this._active 	= -1; //active slide

	this._fwdbck_container = d3.select(div).append("div")
		.classed("button_container",true);

	this._caption_container = d3.select(div).append("div")
		.classed("caption",true);

	this._slider_container = d3.select(div).append("div")
		.classed("slider_container",true);

	this._button_container = d3.select(div).append("div")
		.classed("button_container",true);

	this.addButton("bck","bck",function(self,parent){
		if(parent._active<1){return;}
		parent.setActive(parent._active-1);

	},false,false,true);
	this._fwdbck_container.append("span")
		.classed("xofy",true)
		.text("x of y");
	this.addButton("fwd","fwd",function(self,parent){
		if(parent._active>parent._slides.length-2){return;}
		parent.setActive(parent._active+1);
	},false,false,true);
};

Slideshow.prototype.addSlides = function(slide_arr, cap_arr) {
	if(slide_arr.length !== cap_arr.length) throw "Unmatched slide/caption";
	for (var i=0; i<slide_arr.length; i++){
		this._slides.push(slide_arr[i]);
		this._captions.push(cap_arr[i]);
		slide_arr[i].svg.attr("display","none");
	}
	return this;
};
Slideshow.prototype.addButton = function(name,text,f_on,f_off,ison,fwdbck) {
	/*
		name: name of button, text: button text,
		f_on/off: func called when triggered on/off,
		ison: does the button begin on? Also defines state on slide change,
		fwdbck:add to the fwdbck container or standard the button container?
	*/
	if(typeof f_off === "undefined" || f_off === false){f_off = f_on;}
	if(typeof ison === "undefined"){ison = false;}
	if(typeof fwdbck === "undefined"){fwdbck = false;}

	var that = this;
	var id = (this._div+"_button_"+name).slice(1);
	this._buttons[name] = {
		id:id,text:text,f_on:f_on,f_off:f_off,ison:ison,onchange:ison};

	var container = fwdbck? this._fwdbck_container:this._button_container
	container.append("span")
		.classed("button",true)
		.attr("id",id)
		.text("| "+text+" |")
		.on("click",function(){
			//this = span element; that = slideshow object
			if (that._buttons[name].ison){
				f_off(this,that);
				that._buttons[name].ison = false;
			}else{
				f_on(this,that);
				that._buttons[name].ison = true;
			}
		});
	return this;
};

Slideshow.prototype.setActive = function(slide_id) {
	if(this._active<0){//first time
		this._active = slide_id;
	}else{
		for (var name in this._buttons){
			if (name === "fwd" || name === "bck") continue;
			var self = d3.select("#"+this._buttons[name].id)[0][0]; //html element of button
			if (this._buttons[name].ison) { //turn everything off
				this._buttons[name].f_off(self,this);
				this._buttons[name].ison = false;
			}
		}
		this._slides[this._active].animating = false;
		this._slides[this._active].svg.attr("display","none");
		this._active = slide_id;
		if (this.autoplay){
			this._slides[this._active].animating = true;
			this._slides[this._active]._animate()
		}
	}

	this._slides[this._active].svg.attr("display","inline");
	this._fwdbck_container.select(".xofy").text((this._active+1)+" of "+this._slides.length);
	this._caption_container.html(this._captions[this._active]);
	for (var name in this._buttons){
		if (name === "fwd" || name === "bck") continue;
		var self = d3.select("#"+this._buttons[name].id)[0][0];
		if (this._buttons[name].onchange) {
			this._buttons[name].f_on(self,this);
			this._buttons[name].ison = true;
		}
	}

	if(this._active===0) d3.select("#"+this._buttons["bck"].id).style("color","grey");
	else if (this._active===1) d3.select("#"+this._buttons["bck"].id).style("color","black");
	if (this._active===this._slides.length-2) d3.select("#"+this._buttons["fwd"].id).style("color","black");
	else if (this._active===this._slides.length-1) d3.select("#"+this._buttons["fwd"].id).style("color","grey");

	for (var i=0; i<this.setActiveExtra.length; i++){
		this.setActiveExtra[i](this);
	}

	return this;
};

var sin_trace = new SingleTrig("#sin_trace",200,width,280,100,1,0,60);
var cos_trace = new SingleTrig("#cos_trace",200,width,280,100,1,Math.PI/2,60);
var sin_i = new SingleTrig("#sin_i",200,width,320,
	d3.select("#sin_i_a").property("value"),
	d3.select("#sin_i_c").property("value"),
	d3.select("#sin_i_p").property("value")*Math.PI,
	60);

var sumslides = new Slideshow("#sumslides")
	.addSlides(
		[	
			new MultiTrig("#sumslides",180,width,300,[70,70],[1,1],[0,0],60),
			new MultiTrig("#sumslides",180,width,300,[70,70],[1,1],[Math.PI,0],60),
			new MultiTrig("#sumslides",180,width,300,[70,70],[1,2],[0,0],60),
			new MultiTrig("#sumslides",180,width,300,[70,70/5],[1,2],[0,0],60),
			new MultiTrig("#sumslides",180,width,300,[70,70/5],[2,1],[0,0],60),
			new MultiTrig("#sumslides",180,width,300,[70,70],[7,8],[0,0],240)],
		[
			"<span class=\"eqn\">Sin(x)+Sin(x) = 2Sin(x)</span>.<br>Adding waves of the same frequency and phase results in <b>complete constructive interference</b>.",
			"<span class=\"eqn\">Sin(x+pi)+Sin(x) = 0</span>.<br>Adding waves of the same frequency but with half-cycle phase difference results in <b>complete destructive interference</b>",
			"<span class=\"eqn\">Sin(x)+Sin(2x)</span>.<br>In general, waves will interfere both constructively and destructively. Here, two waves of different frequencies are added - notice how there are are two oscillations of the outer circle for every one oscillation of the inner circle.",
			"<span class=\"eqn\">Sin(x)+0.2Sin(2x)</span>.<br>The greater the amplitude, the more it will affect the overall shape. Notice how this looks more like sin(x) than sin(2x)...",
			"<span class=\"eqn\">Sin(2x)+0.2Sin(x)</span>.<br>...whereas this looks more like sin(2x)",
			"<span class=\"eqn\">Sin(7x)+Sin(8x)</span>.<br>Adding waves of similar (but different) frequencies results in visible <b>beating</b>, with the amplitudes bound by an oscillating envelope (whose frequency is the difference of the the two interfering waves). I recommend hitting the <b>SCAN</b> button to see the envelope."
		])
	.addButton("scan","SCAN",
		function(self,parent){
			parent._slides[parent._active].setScanning(true);
			d3.select(self).style("color","orange");
		}, 
		function(self,parent){
			parent._slides[parent._active].setScanning(false);
			d3.select(self).style("color","black");
		},
		false)
	.setActive(0);

var fourier={
	amp:{
		sawtooth:[],
		triangle:[],
		square:[]
	},
	freqs:[], //[1,2,3,...]
	phases:[] //[0,0,0,...]
};
for(var i=1; i<=50; i++){
	fourier.freqs.push(i);
	fourier.phases.push(0);
	fourier.amp.sawtooth.push(-70/i);
	fourier.amp.square.push(i%2 ? 70/i : 0);
	var sgn = (i-1)%4 === 0? 1 : -1;
	fourier.amp.triangle.push(i%2 ? 70*sgn/(i*i) : 0);
}
var fourierslides = new Slideshow("#fourierslides").addSlides(
	[	new MultiTrig("#fourierslides",180,width,300,fourier.amp.square.slice(),fourier.freqs.slice(),fourier.phases.slice(),180,5),
		new MultiTrig("#fourierslides",180,width,300,fourier.amp.sawtooth.slice(),fourier.freqs.slice(),fourier.phases.slice(),180,5),
		new MultiTrig("#fourierslides",180,width,300,fourier.amp.triangle.slice(),fourier.freqs.slice(),fourier.phases.slice(),180,5)
		],
	[	"<span class=\"eqn\">sin(x) + 0 + sin(3x)/3 + 0 + sin(5x)/5 + ...</span><br>A <b>square wave</b>. Every other term is zero, so a new circle is only visible every two terms.", 
		"<span class=\"eqn\">sin(x) - sin(2x)/2 - sin(3x)/3 - sin(4x)/4 - ...</span><br>A <b>sawtooth wave</b>.",
		"A <b>triangle wave</b>. Like the square wave, every other term is zero."
	])
	.addButton("scan","SCAN",
		function(self,parent){
			parent._slides[parent._active].setScanning(true);
			d3.select(self).style("color","orange");
		}, 
		function(self,parent){
			parent._slides[parent._active].setScanning(false);
			d3.select(self).style("color","black");
		},
		false)
	.addButton("add","Add Term",
		function(self,parent){
			var slide = parent._slides[parent._active];
			if(slide._terms>=slide._a.length) return;
			slide.setTerms(slide._terms+1);
			if(slide._terms>=slide._a.length) d3.select(self).style("color","grey");	
			else if(slide._terms===2) d3.select("#"+parent._buttons["sub"].id).style("color","black");
		})
	.addButton("sub","Remove Term",
		function(self,parent){
			var slide = parent._slides[parent._active];
			if(slide._terms<=1) return;
			slide.setTerms(slide._terms-1);
			if(slide._terms<=1) d3.select(self).style("color","grey");
			else if(slide._terms===slide._a.length-1) d3.select("#"+parent._buttons["add"].id).style("color","black");
		})
	.setActive(0)
	.setActiveExtra.push(
		function(parent){
			var slide = parent._slides[parent._active];
			//Update colors of sub/add buttons
			switch(slide._terms){
				case 1: 
					d3.select("#"+parent._buttons["sub"].id).style("color","grey");
					break;
				case 2: 
					d3.select("#"+parent._buttons["sub"].id).style("color","black");
					break;
				case slide._a.length-1: 
					d3.select("#"+parent._buttons["add"].id).style("color","black");
					break;
				case slide._a.length: 
					d3.select("#"+parent._buttons["add"].id).style("color","grey");
					break;
			}
		}
	);

var travelslides = new Slideshow("#travelslides")
	.addSlides(
		[
		new TravelTrig("#travelslides",100,width,300,[70],[1],[0],[0],50,120,true,false),
		new TravelTrig("#travelslides",100,width,300,[70],[0],[1],[0],50,120,true,false),
		new TravelTrig("#travelslides",100,width,300,[70],[1],[1],[0],50,120,true,false),
		new TravelTrig("#travelslides",100,width,300,[70],[-1],[1],[0],50,120,true,false),
		new TravelTrig("#travelslides",100,width,300,[70],[-2],[1],[0],50,120,true,false),
		new TravelTrig("#travelslides",100,width,300,[70],[-1],[2],[0],50,120,true,false),
		new TravelTrig("#travelslides",100,width,300,[70,70],[-1,-2],[3,3],[0,0],50,120,true,false),
		new TravelTrig("#travelslides",100,width,300,[70,70],[1,1],[0.5*7,-0.5*7,],[Math.PI,0],50,120,true,false),
		new TravelTrig("#travelslides",100,width,300,[35,35,35],[1,-2,1],[-0.5*7,-0.5*7,2*0.5*7],[2*Math.PI/3,2*2*Math.PI/3,3*2*Math.PI/3],50,120,true,false)
		],
		[
			"<span class=\"eqn\">sin(t)</span><br>With no x-dependence, all atoms are at the same height, regardless of position.",
			"<span class=\"eqn\">sin(x)</span><br>With no t-dependence, the atoms' heights depend only on position, and cannot change with time.",
			"<span class=\"eqn\">sin(x + t)</span><br>Each atom's height varies sinusoidally with time. At the same time, each have a phase offset depending on their x-position.",
			"<span class=\"eqn\">sin(x - t)</span><br>Changing the sign of either x or t reverses the direction of the wave.",
			"<span class=\"eqn\">sin(x - 2t)</span><br>Increasing the temporal frequency increases how many cycles are observed per unit time. Here we have twice as many oscillations per second as before.",
			"<span class=\"eqn\">sin(2x - t)</span><br> Increasing the spatial frequency increases how many cycles are observed within a certain space. Here we have twice as many oscillations within the same space as before.",
			"<span class=\"eqn\">sin(3x - t) + sin(3x - 2t)</span><br>Just like before, travelling waves interfere with each other to produce new patterns.",
			"<span class=\"eqn\">sin(3.5x + t) + sin(-3.5x + t)</span><br>When two identical waves travelling in opposite directions interfere, they produce a standing wave: they interfere destructively at some points, and constructively at others.",
			"And of course, we can model the interference of more than two travelling waves."
		]
	)
	.addButton("atoms","Show Atoms",
		function(self,parent){
			parent._slides[parent._active].toggleAtoms(true);
			d3.select(self).style("color","orange");
		}, 
		function(self,parent){
			parent._slides[parent._active].toggleAtoms(false);
			d3.select(self).style("color","black");
		},
		true)

	.addButton("graph","Show Graph",
		function(self,parent){
			parent._slides[parent._active].togglePath(true);
			d3.select(self).style("color","orange");
		}, 
		function(self,parent){
			parent._slides[parent._active].togglePath(false);
			d3.select(self).style("color","black");
		},
		false)

	.addButton("circles","Show Circles",
		function(self,parent){
			parent._slides[parent._active].toggleCircles(true);
			d3.select(self).style("color","orange");
		},
		function(self,parent){
			parent._slides[parent._active].toggleCircles(false);
			d3.select(self).style("color","black");

		},true
	)
	.setActive(0)
	.autoplay = true;
// on change 

d3.select("#sin_i_a")
	.on("change",function(){
		var val = parseFloat(d3.select(this).property("value"));
		d3.select("#sin_i_a_label").text(val);	
		sin_i.setAmp(val);
		sin_i.rebuild();
	});
d3.select("#sin_i_c")
	.on("change",function(){
		var val = parseFloat(d3.select(this).property("value"));
		d3.select("#sin_i_c_label").text(val);	
		sin_i.setCycle(val);
		sin_i.rebuild();
	});
d3.select("#sin_i_p")
	.on("change",function(){
		var val = parseFloat(d3.select(this).property("value"));
		d3.select("#sin_i_p_label").text(val+"\u03C0");	
		sin_i.setPhase(val*Math.PI);
		sin_i.rebuild();
	});

})();