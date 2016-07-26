(function(){
'use strict'
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
	this._tracer = this.svg.append('circle')
 		.attr('cx',this._xs[this.tick])
		.attr('cy',this._ys[this.tick])
		.attr('r',4)
		.style('fill','black');
	//line connecting tracer to origin
	this._line_r = this.svg.append('line')
		.attr('x1',this._x)
		.attr('y1',this._y)
		.attr('x2',this._xs[this.tick])
		.attr('y2',this._ys[this.tick]);
	//line indicating the starting phase
	this._line_zero = this.svg.append('line')
		.attr('x1',this._x)
		.attr('y1',this._y)
		.attr('x2',this._xs[0])
		.attr('y2',this._ys[0]);
	//inner arc indicating angle elapsed
	this._arcfunc = d3.svg.arc()
	    .innerRadius(0)
	    .outerRadius(this._a/10)
	    .startAngle(Math.PI/2-this._p)
	    .endAngle(Math.PI/2-this._p);
    this._arcpath = this.svg.append('path')
	    .attr("d",this._arcfunc)
	    .attr("transform", "translate("+this._x+","+this._y+")")
	    .style('fill','blue')
	    .style('opacity','0.5');
    this._arctxt = this.svg.append('text')
    	.attr('x',this._x+2)
    	.attr('y',this._y-10)
    	.text('')
    	.style('fill','steelblue');

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

	//line following the current x value
	this._line_y = this.svg.append('line')
		.attr('x1',this._xs[0])
		.attr('y1',this._ys[0])
		.attr('x2',this._xscale(0))
		.attr('y2',this._ys[0])
		.style('opacity','0');
	//line following the current y value
	this._line_x = this.svg.append('line')
		.attr('x1',this._xscale(0))
		.attr('y1',this._y)
		.attr('x2',this._xscale(0))
		.attr('y2',this._ys[0])
		.style('stroke','steelblue')
		.style('opacity','0');
	//x-axis for plot
	this._axis_x = this.svg.append('line')
		.attr('x1',this._xscale(0))
		.attr('y1',this._y)
		.attr('x2',this._xscale(this._tickmax))
		.attr('y2',this._y);

	this._axistxt = [];

	for (var i=0.5; i<=2; i+=0.5){
		this._axistxt.push(
			this.svg.append('text')
	    	.attr('x',this._xscale(Math.round(i*this._tickmax)/2))
	    	.attr('y',this._y+20)
	    	.text(i+'\u03C0')
	    	.style('fill','darkred')
	    	.style('text-anchor','middle')
	    	.style('opacity','0')
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

	this._circle.attr('r',this._a);
	this._line_zero
		.attr('x2',this._xs[0])
		.attr('y2',this._ys[0]);
	this._line_r
		.attr('x2',this._xs[0])
		.attr('y2',this._ys[0]);
	this._tracer
		.attr('cx',this._xs[0])
		.attr('cy',this._ys[0]);
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
		this._line_x.style('opacity',1);
		this._line_y.style('opacity',1);
		this._axistxt[0].style('opacity','0');
		this._axistxt[1].style('opacity','0');
		this._axistxt[2].style('opacity','0');
		this._axistxt[3].style('opacity','0');
	}
	else if (this.tick===Math.floor(this._tickmax/4)){
		this._axistxt[0].style('opacity','1');
	}
	else if (this.tick===Math.floor(this._tickmax/2)){
		this._axistxt[1].style('opacity','1');
	}
	else if (this.tick===Math.floor(3*this._tickmax/4)){
		this._axistxt[2].style('opacity','1');
	}
	else if(this.tick>=this._tickmax) {
		this.tick = 0; 
		this.animating = false;

		this._axistxt[3].style('opacity','1');
		this._line_x.style('opacity',0);
		this._line_y.style('opacity',0);

		return;
	}
	this.tick++;
	this._tracer
		.attr('cx',this._xs[this.tick])
		.attr('cy',this._ys[this.tick]);

	this._line_r
		.attr('x2',this._xs[this.tick])
		.attr('y2',this._ys[this.tick])

	var ang = this.tick*2*this._c*Math.PI/this._tickmax;
	this._arctxt.text((ang/Math.PI).toFixed(1)+"\u03C0");
	this._arcfunc.endAngle(Math.PI/2-ang-this._p);
	this._arcpath.attr("d",this._arcfunc);

	this._line_y
		.attr('x1',this._xs[this.tick])
		.attr('y1',this._ys[this.tick])
		.attr('x2',this._xscale(this.tick))
		.attr('y2',this._ys[this.tick]);

	this._line_x
		.attr('x1',this._xscale(this.tick))
		.attr('x2',this._xscale(this.tick))
		.attr('y2',this._ys[this.tick]);

	this._graph.attr('d',this._graphfunc(this._ys.slice(0,this.tick+1)));
	
	this._animate();
};
SingleTrig.prototype._calculate = function(){
	this._xs = [];
	this._ys = [];
	// console.log('building...');

	for (var i=0; i<=this._tickmax; i++){
		this._xs.push(
			this._x+this._a*Math.cos(this._p+2*Math.PI*this._c*i/this._tickmax));
		this._ys.push(
			this._y-this._a*Math.sin(this._p+2*Math.PI*this._c*i/this._tickmax));
	}
}
SingleTrig.prototype.setAmp = function(a){
	//not visible until rebuilt
	this._a = a;
}
SingleTrig.prototype.setCycle = function(c){
	//not visible until rebuilt
	this._c = c;
}
SingleTrig.prototype.setPhase = function(p){
	//not visible until rebuilt
	this._p = p;
}
SingleTrig.prototype.setFrames = function(f) {
	//not visible until rebuilt
	this._frames = f;
};

//div,x,y,w,h,a,c,p,frames
var sin_trace = new SingleTrig("#sin_trace",200,840,280,100,1,0,60);
var cos_trace = new SingleTrig("#cos_trace",200,840,280,100,1,Math.PI/2,60);
var sin_i = new SingleTrig("#sin_i",200,840,320,
	d3.select("#sin_i_a").property('value'),
	d3.select("#sin_i_c").property('value'),
	d3.select("#sin_i_p").property('value')*Math.PI,
	60);


// on change listeners

d3.select("#sin_i_a").on("change",function(){
	var val = parseFloat(d3.select(this).property('value'));
	d3.select("#sin_i_a_label").text(val);	
	sin_i.setAmp(val);
	sin_i.rebuild();
});
d3.select("#sin_i_c").on("change",function(){
	var val = parseFloat(d3.select(this).property('value'));
	d3.select("#sin_i_c_label").text(val);	
	sin_i.setCycle(val);
	sin_i.rebuild();
});
d3.select("#sin_i_p").on("change",function(){
	var val = parseFloat(d3.select(this).property('value'));
	d3.select("#sin_i_p_label").text(val+"\u03C0");	
	sin_i.setPhase(val*Math.PI);
	sin_i.rebuild();
});

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
	this._scan = !this._scan;
}

// div,x,w,h,a,c,p,frames

var sum_slide = 0;
var slides_sum = [
	new MultiTrig('#slidesum',180,width,300,[70,70],[1,1],[0,0],60),
	new MultiTrig('#slidesum',180,width,300,[70,70],[1,1],[0,Math.PI],60),
	new MultiTrig('#slidesum',180,width,300,[70,70],[7,8],[0,0],240)
];
slides_sum[1].svg.attr('display','none');
slides_sum[2].svg.attr('display','none');
//div_id,w,h,xOff,xDrawOff,amp,cycles,phase,frames,scannable




var fourier={
	amp:{
		sawtooth:[],
		triangle:[],
		square:[]
	},
	freqs:[], //[1,2,3,...]
	phases:[] //[0,0,0,...]
};
for(var i=1; i<=40; i++){
	fourier.freqs.push(i);
	fourier.phases.push(0);
	fourier.amp.sawtooth.push(-100/i);
	fourier.amp.square.push(i%2 ? 100/i : 0);
	var sgn = (i-1)%4 === 0? 1 : -1;
	fourier.amp.triangle.push(i%2 ? 100*sgn/(i*i) : 0);
}

var UpdateCaption = function(){
	d3.select('#slidesum_prog').text((sum_slide+1)+' of '+slides_sum.length);
	var str;
	switch(sum_slide){
		case 0:
			str='Adding waves of the same frequency and phase results in <b>constructive interference</b>';
			break;
		case 1:
			str='Adding waves of the same frequency but with half-cycle phase difference results in <b>destructive interference</b>';
			break;
		case 2:
			str='Adding waves of different frequencies results in <b>beating</b>, with the amplitudes bound by an oscillating envelope (whose frequency is the difference of the the two interfering waves)';
			break;
		case 3:
			str='<b>Caption for 4</b>';
			break;
		default:
			str='';
			break;
	}

	d3.select('#slidesum_caption').html(str);
};

UpdateCaption()

d3.select('#slidesum_fwd')
	.on('click',function(){
		if(sum_slide>=slides_sum.length-1){return;}
		else{
			slides_sum[sum_slide].svg.attr('display','none');
			sum_slide++;
			slides_sum[sum_slide].svg.attr('display','inline');
			UpdateCaption()
		}
	});
d3.select('#slidesum_bck')
	.on('click',function(){
		if(sum_slide<=0){return;}
		else{
			slides_sum[sum_slide].svg.attr('display','none');
			sum_slide--;
			slides_sum[sum_slide].svg.attr('display','inline');
		}

	});

// div,x,w,h,a,c,p,frames
	// new MultiTrig('#slidesum',180,width,300,[70,70],[1,1],[0,0],60),
var fourier_slide = 0;
var slides_fourier = [

	new MultiTrig('#slidefourier',180,width,300,fourier.amp.sawtooth.slice(),fourier.freqs.slice(),fourier.phases.slice(),120),
	new MultiTrig('#slidefourier',180,width,300,fourier.amp.triangle.slice(),fourier.freqs.slice(),fourier.phases.slice(),120),
	new MultiTrig('#slidefourier',180,width,300,fourier.amp.square.slice(),fourier.freqs.slice(),fourier.phases.slice(),120)
];
slides_fourier[1].svg.attr('display','none');
slides_fourier[2].svg.attr('display','none');


d3.select('#slidefourier_fwd')
	.on('click',function(){
		if(fourier_slide>=slides_fourier.length-1){return;}
		else{
			slides_fourier[fourier_slide].svg.attr('display','none');
			fourier_slide++;
			slides_fourier[fourier_slide].svg.attr('display','inline');
		}
	});
d3.select('#slidefourier_bck')
	.on('click',function(){
		if(fourier_slide<=0){return;}
		else{
			slides_fourier[fourier_slide].svg.attr('display','none');
			fourier_slide--;
			slides_fourier[fourier_slide].svg.attr('display','inline');
			UpdateCaption()
		}

	});

})();