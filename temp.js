"use strict"

var MultiTrig = function(div,x,w,h,a,c,p,frames) {
	/*
	Diagram involving a single circle.
	x: center of circle. w,h: svg dimensions.
	a,c,p = *ARRAYS* of amplitudes, cycles and phases of circle.
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
	//new:
	this._terms = a.length; //no. of terms in series
	this._pos; //set of each x and y for each circle
	this._scan = false;
	this._scan_ys;

	var that = this;

	this._calculate();

	this.svg = d3.select(div).insert("svg",":first-child")
		.attr("width",w)
		.attr("height",h);

	this._circles = this.svg.selectAll("circle")
	.data(this._a).enter().append("circle")
		.attr("cx",function(d,i){return that._pos.x[i][that.tick];})
		.attr("cy",function(d,i){return that._pos.y[i][that.tick];})
		.attr("r",function(d){return Math.abs(d);});

	this._tracer = this.svg.append("circle")
 		.attr('cx',this._xs[this.tick])
		.attr('cy',this._ys[this.tick])
		.attr('r',4)
		.style('fill','black');

	this._line_y = this.svg.append("line");

	this._xscale = d3.scale.linear()
	    .domain([0,this._tickmax])
		.range([this._x+this.plotoffset,this._x+this.plotlength]);

    this._plot = this.svg.append('g');

	this._graphfunc = d3.svg.line()
		.x(function(d,i){return this._xscale(i);})
		.y(function(d){return d;})
		.interpolate('basis');
	this._graph = this._plot.append('path')
		.classed('graph',true);


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
MultiTrig.prototype.rebuild = function() {
	//Rebuild the image using new a,c,p,f etc...
};
MultiTrig.prototype._animate = function() {
	var that = this;
	setTimeout(function(){
		that.update();
	},this.framelength);
};
MultiTrig.prototype.update = function() {
	if(!this.animating){return;}
	var that=this;
	

	
	if (this._scan){
		if(this.tick>=this._tickmax) {//final frame
			this.tick = 0;
		}
		this._line_y.attr('x2',this._xscale(0))//*
		this._graph.attr('d',this._graphfunc(this._scan_ys));

		this._scan_ys.push(this._scan_ys.shift())
	}
	else{
		if(this.tick>this._tickmax) {//final frame
			this.tick = 0; 
			this.animating = false;
			return;
		}
		this._line_y.attr('x2',this._xscale(this.tick));

		this._graph.attr('d',this._graphfunc(this._ys.slice(0,this.tick+1)));
	}
	
	this._circles
		.attr('cx',function(d,i){return that._pos.x[i][that.tick]})
		.attr('cy',function(d,i){return that._pos.y[i][that.tick]})
	this._tracer
		.attr('cx',this._xs[this.tick])
		.attr('cy',this._ys[this.tick])

	this._line_y
		.attr('x1',this._xs[this.tick])
		.attr('y1',this._ys[this.tick])
		.attr('y2',this._ys[this.tick]);

	this.tick++;
	this._animate();
};

MultiTrig.prototype.setAmps = function(a){
	//not visible until rebuilt
	this._a = a;
};
MultiTrig.prototype.setCycles = function(c){
	//not visible until rebuilt
	this._c = c;
};
MultiTrig.prototype.setPhases = function(p){
	//not visible until rebuilt
	this._p = p;
};
MultiTrig.prototype.setFrames = function(f) {
	//not visible until rebuilt
	this._frames = f;
};
MultiTrig.prototype.toggleScanning = function(){
	this.tick = 0;
	this._scan = true;
}

// div,x,w,h,a,c,p,frames
var test1 = new MultiTrig("#test1",200,840,280,
	[-100,-100/2,-100/3,-100/4],[1,2,3,4],[0,0,0,0],60);
test1._scan = true;