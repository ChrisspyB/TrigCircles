

var margin = {top:50, right:50, bottom:50, left:50};

var height 		= 800 - margin.top - margin.bottom,
	width 		= 1200 - margin.left - margin.right;

//position and size variables for circle
var r = 150,
	cx = 200 + margin.left,
	cy = 200 + margin.top,
	px = cx+r,
	py = cy,
	pr = 10;

var t=0, //time
	f = 0.1 //angular frequency
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

d3.select('svg').append('circle')
	.attr('id','tracer')
	.attr('cx',px)
	.attr("cy",py)
	.attr("r",pr)
	.style("fill","black")
	.style("stroke","black")
		// .style("stroke-width",5)

function trace () {
	setTimeout(function() {
		t+=1;
		px=cx-r*Math.cos(f*t);
		py=cy+r*Math.sin(f*t);
		
		d3.select('#tracer').attr('cy',py);
		d3.select('#tracer').attr('cx',px);

		if (animating){trace();}
	}
	,tr_delay);
};

trace();

d3.select("svg").on("click",function(){
	if (animating) {animating=false;}
	else {
		animating=true;
		trace();
	}
});