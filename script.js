

var margin = {top:50, right:50, bottom:50, left:50};

var height 		= 800 - margin.top - margin.bottom,
	width 		= 1200 - margin.left - margin.right;

//position and size variables for circle
var r = 150,
	cx = 200 + margin.left,
	cy = 200 + margin.top,
	px = cx+r,
	py = cy;

var t=0, //time
	f = 0.08 //angular frequency
	tr_delay = 30; //time between animation updates

var animating = false;


var tooltip = d3.select('body').append('div')
	.attr('id','tooltip')
	.style('position','absolute')
	.style('opacity',0.5)
	.style('top',(height-margin.top-margin.bottom)+'px')
	.style('left',margin.left+10+'px')
	.style('font-size',80+'px')

d3.select('#chart1').append('svg')
	.style('background','#EEEEEE')
	.attr('width',width + margin.left + margin.right)
	.attr('height',height + margin.top + margin.bottom)
	.on("mouseover",function(){
		tooltip.html("Click to <b>play/pause</b>");
	})
	.on("mouseout",function(){
		tooltip.html("");
	})
	//---For margin display----
	.append('rect')
		.attr("width",width)
		.attr("height",height)
		.attr("x",margin.left)
		.attr("y",margin.top)
		.style('fill','white')
	//-------------------------
d3.select('svg').append('circle')
		.attr('cx',cx)
		.attr("cy",cy)
		.attr("r",r)
		.style("stroke","black")
		.style("stroke-width",5)

//---tracer---
d3.select('svg').append('circle')
	.attr('id','tracer')
	.attr('cx',px)
	.attr("cy",py)
	.attr("r",4)
	.style("fill","red")
	.style("stroke","none")

d3.select('svg').append('line')
	.attr('id','liner_r')
	.attr('x1',cx)
	.attr('y1',cy)
	.attr('x2',px)
	.attr('y2',py)
	.style("stroke","black")
	.style('stroke-width',2)

d3.select('svg').append('line')
	.attr('id','liner_x')
	.attr('x1',cx)
	.attr('y1',cy)
	.attr('x2',px)
	.attr('y2',cy)
	.style("stroke","green")
	.style('stroke-width',2)

d3.select('svg').append('line')
	.attr('id','liner_y')
	.attr('x1',cx)
	.attr('y1',cy)
	.attr('x2',cx)
	.attr('y2',py)
	.style("stroke","red")
	.style('stroke-width',2)
///-----------

function trace () {
	setTimeout(function() {
		t+=1;
		px=cx+r*Math.cos(f*t);
		py=cy-r*Math.sin(f*t);
		
		d3.select('#tracer')
			.attr('cy',py)
			.attr('cx',px);
		d3.select('#liner_r')
			.attr('y2',py)
			.attr('x2',px);
		d3.select('#liner_x').attr('x2',px);
		d3.select('#liner_y')
			.attr('y2',py)
			.attr('x1',px)
			.attr('x2',px);

		if (animating){trace();}
	}
	,tr_delay);
};

d3.select("svg").on("click",function(){
	if (animating) {animating=false;}
	else {
		animating=true;
		trace();
	}
});