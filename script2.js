(function(){
"use strict"
//---Summing circles---


var margin = {top:50, right:50, bottom:50, left:50},
	height 		= 800 - margin.top - margin.bottom,
	width 		= 1200 - margin.left - margin.right,

	t = 0,

	//********use d3 range********
	x_off = 400,
	y_off = 400,

	animating = false,
	ani_steps  = 50, //steps per period.
	t_step = 2*Math.PI/ani_steps,
	ani_delay = 1000, //

//to be destroyed
	terms = 5,
	amp = [],
	freq = [];

	for(var i=0; i<terms; i++){amp.push((terms-i)*25);}
	for(var i=0; i<terms; i++){freq.push(i+1);}
	console.log(amp)

//a,f,n:
//a: array of amplitudes
//f: array of frequencies
//n: number of terms in sum
var SinSum = function(a,f,n){
	var sum = 0;
	for (var i = 0; i<n; i++){
		sum+=a[i]*Math.sin(f[i]*t);
	}
	return sum;
};
var CosSum = function(a,f,n){
	var sum = 0;
	for (var i = 0; i<n; i++){
		sum+=a[i]*Math.cos(f[i]*t);
	}
	return sum;
};

var svg = d3.select('#chart2').append('svg')
	.attr('width',width+margin.left+margin.right)
	.attr('height',height+margin.bottom+margin.top)
	.style('background','#eee');

svg.append('rect')
	.attr("width",width)
	.attr("height",height)
	.attr("x",margin.left)
	.attr("y",margin.top)
	.style('fill','white');

var circles = svg.selectAll('circle')
	.data(amp)
	.enter()
		.append('circle')
			.attr('cx',function(d,i){
				return x_off+CosSum(amp,freq,i);
			})
			.attr('cy',function(d,i){
				return y_off+SinSum(amp,freq,i);;
			})
			.attr('r',function(d){return d;})
			.style('fill','none')
			.style('stroke','black');

///

///

var animate = function(){
	setTimeout(function(){
		//...UpdatePositions();
		if (!animating){return;}
		t+=t_step;

		circles
			.attr('cx',function(d,i){return x_off+CosSum(amp,freq,i);})
			.attr('cy',function(d,i){return y_off+SinSum(amp,freq,i);});




		animate();
	},ani_delay/10);
};

svg.on("click",function(){
	if (animating) {animating=false;}
	else {
		animating=true;
		animate();
	}
});

})();