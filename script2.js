(function(){
"use strict"
//---Summing circles---


var margin = {top:50, right:50, bottom:50, left:50},
	height 		= 600 - margin.top - margin.bottom,
	width 		= 1200 - margin.left - margin.right,

	t = 0,

	//********use d3 range********
	//********Need to skip r=0 circles********
	x_off = width/4,
	y_off = height/2,
	amp_scaling = 100,
	freq_scaling = 1,
	trace_r=3,
	animating = false,
	ani_steps  = 50, //steps per period.
	t_step = 2*Math.PI/ani_steps,
	ani_delay = 1000, //
	step = 0,

//to be destroyed
	terms = 8,
	amp = [],
	freq = [];

var GenSeries = function(type){
	amp = [], freq = [];
	var a = 0, f = 0;
	for(var n=1; n<terms; n++){
		f=n;
		var skip = false;
		switch(type){
			case 'sawtooth':
				a=1/n;
				break;
			case 'square':
				a= n%2 ? 1/n:0;
				break;
			case 'triangle':
				var sgn =  (n-1)%4 === 0? 1 : -1;
				a= n%2 ? sgn/(n*n):0;
				break;
			case 'pulse':
				a= n%2 ? 1/n:1;
				break;
			default:
				a=terms-n
		}
		if(skip){continue;}
		amp.push(a*amp_scaling);
		freq.push(f*freq_scaling);
	}
	console.log(amp)
	console.log(freq)
	
};
GenSeries('sawtooth');

var SinSum = function(a,f,n,t){
	//a,f,n:
	//a: array of amplitudes
	//f: array of frequencies
	//n: number of terms in sum
	var sum = 0;
	for (var i = 0; i<n; i++){
		sum+=a[i]*Math.sin(f[i]*t);
	}
	return sum;
};
var CosSum = function(a,f,n,t){
	var sum = 0;
	for (var i = 0; i<n; i++){
		sum+=a[i]*Math.cos(f[i]*t);
	}
	return sum;
};

//----
//The possible positions of each circle

var pos = {
	x:[],
	y:[]
};
for(var i=0; i<terms; i++){
	pos.x.push([]);
	pos.y.push([]);
	for(var j=0; j<ani_steps; j++){
		pos.x[i].push(
			x_off+CosSum(amp,freq,i,j*2*Math.PI/ani_steps));
		pos.y[i].push(
			y_off+SinSum(amp,freq,i,j*2*Math.PI/ani_steps));
	}
}

var trace_y = pos.y[terms-1].slice(0);
var a = trace_y.shift();
		trace_y.push(a); //***

//----
console.log(pos)


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
				return x_off+CosSum(amp,freq,i,t);
			})
			.attr('cy',function(d,i){
				return y_off+SinSum(amp,freq,i,t);;
			})
			.attr('r',function(d){return Math.abs(d);})
			.style('fill','none')
			.style('stroke','black');

var amp_line = svg.append('line')
	.attr('x1',pos.x[0][step])
	.attr('y1',pos.y[terms-1][step])
	.attr('x2',pos.x[terms-1][step])
	.attr('y2',pos.y[terms-1][step])
	.style('stroke','green');

var trace_circles = svg.selectAll('circle')
	.data(trace_y)
	.enter()
		.append('circle')
			.attr('cx',function(d,i){return x_off+(ani_steps-i-1)*20;})
			.attr('cy',function(d,i){return d;})
			.attr('r',trace_r)
			.style('fill','black');

var animate = function(){
	setTimeout(function(){
		//...UpdatePositions();
		if (!animating){return;}
		// t+=t_step;
		step++;
		if(step>=ani_steps){step=0;}
		// step--;
		// if(step<0){step=ani_steps-1;}
		circles
		.attr('cx',function(d,i){return pos.x[i][step];})
		.attr('cy',function(d,i){return pos.y[i][step];});
		amp_line
			.attr('y1',pos.y[terms-1][step])
			.attr('x2',pos.x[terms-1][step])
			.attr('y2',pos.y[terms-1][step]);

		var a = trace_y.shift();
		trace_y.push(a);
		// var a = trace_y.pop();
		// trace_y.unshift(a);
		trace_circles.attr().data(trace_y)
			.attr('cy',function(d,i){return d;})



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

d3.select('#c2_slidediv').on('change',function(){
	var val = d3.select('#c2_slider').property('value');
	d3.select(this).select('label').text(val);
	});
})();