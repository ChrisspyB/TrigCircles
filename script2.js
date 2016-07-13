(function(){
"use strict"
//---Summing circles---


var margin = {top:50, right:50, bottom:50, left:50},
	height 		= 600 - margin.top - margin.bottom,
	width 		= 1200 - margin.left - margin.right,

	//********Need to skip r=0 circles********
	x_off = width/4,
	y_off = height/2,
	amp_scaling = 100,
	freq_scaling = 1,

	ani_updating = true,
	animating = true,

	ani_steps  = 200, //steps per period.
	ani_delay = 100/6, //60 calls per s
	step = 0,

	trace_width = 500,
	trace_sep = trace_width/ani_steps,

//Data and related
	terms =  d3.select('#c2_terms_slider').property('value'), //note: term 1 is the offset
	amp = [],
	freq = [],
	custom_amp = [1,0.5,0.2],
	type = d3.select('#c2_type').property('value'),
	pos = {x:[],y:[]};

	d3.select('#c2_terms_div').select('label').text(terms);

//amp bar chart
var ampChart ={
	x : margin.left+width-width/4,
	y : margin.top+100,
	h:height,
	w:(width)/4,
	bw:30, //bar width
	bsep:30 //bar separation
	};

	
var GenSeries = function(type){
	//Generate the amplitudes and frequencies for the series.
	amp = [], freq = [];
	var a = 0, f = 0;
	for(var n=1; n<terms; n++){
		f=n;
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
			case 'custom':
				if(n>custom_amp.length){a=0;}
				else{a=custom_amp[n-1];}
				break;
			default:
				a=terms-n
		}
		d3.select('#c2_amp_div').selectAll('.c2_amp_slider:nth-child('+n+')')
			.property('value',a);
		amp.push(a*amp_scaling);
		freq.push(f*freq_scaling);
	}
	
};

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

var GenPos = function(){
	pos={x:[],y:[]};
	//Generate the possible positions of each circle
	for(var i=0; i<terms; i++){
		pos.x.push([]);
		pos.y.push([]);
		for(var j=0; j<ani_steps; j++){
			pos.x[i].push(
				x_off+CosSum(amp,freq,i,j*2*Math.PI/ani_steps));
			pos.y[i].push(
				y_off-SinSum(amp,freq,i,j*2*Math.PI/ani_steps));
		}
	}
};
//--Initial Data Setup--
GenSeries(type);
GenPos();

var trace_y = pos.y[terms-1].slice(0);
trace_y.push(trace_y.shift()); //****

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

var circlesGroup = svg.append('g');
var circles = circlesGroup.selectAll('circle');

var amp_line = circlesGroup.append('line')
	.attr('x1',pos.x[0][step]) //Fixed
	.style('stroke','green')
	.style('stroke-width','2');

var trace_linefunc = d3.svg.line()
	.x(function(d,i){return x_off+(ani_steps-1-i)*trace_sep;})
	.y(function(d,i){return d;})
	.interpolate('basis');

var trace_line = svg.append('path').attr('id','trace_line');
//-----------------
var xScale = d3.scale.ordinal()
	.rangeBands([0,ampChart.w])

var hAxis = d3.svg.axis()
	.orient('bottom')
	.tickValues(0);

var ampGroup = svg.append('g');

var y_amp = d3.scale.linear()
	.domain([0,d3.max(amp,function(d){return Math.abs(d)})])
	.range([0,ampChart.h/2]);

var hGuide = ampGroup.append('g')
		hAxis(hGuide)
		hGuide.attr('transform','translate('+ampChart.x+', '+(ampChart.y+ampChart.h/2)+')')
		hGuide.selectAll('path')
			.style({fill: 'none',stroke:'#000'})
		hGuide.selectAll('line')
			.style({stroke:'#000'})

//-----------------
// Updates and animation
var Animate = function(initialize){
	setTimeout(function(){
		if(ani_updating){

			Recaclulate();
			ani_updating=false;

			y_amp.domain([0,d3.max(amp,function(d){return Math.abs(d)})]);
			xScale.domain(d3.range(0,amp.length)).rangeBands([0,ampChart.w]);

			hAxis.scale(xScale);
			hAxis(hGuide);

			var ampBars = ampGroup.selectAll('rect').data(amp)
				.attr("width",xScale.rangeBand())
				.attr("x",function(d,i){return ampChart.x+xScale(i);})
				.attr("y",function(d){
					return ampChart.y+(d>0? ampChart.h/2-y_amp(d):ampChart.h/2);})
				.attr('height', function(d){return y_amp(Math.abs(d));});
			
			ampBars.enter()
				.append('rect')
				.attr('id','bar')
				.attr("width",xScale.rangeBand())
				.attr("x",function(d,i){return ampChart.x+xScale(i);})
				.attr("height",function(d){return y_amp(Math.abs(d));})
				.attr("y",function(d){
					return ampChart.y+(d>0? ampChart.h/2-y_amp(d):ampChart.h/2);
				});

			ampBars.exit().remove();

			var ampSliders = d3.select('#c2_amp_div').selectAll('input').data(amp)
			.attr('id',function(d,i) {return i;})
			.attr('value',function(d) {return d/amp_scaling;})
			.property('disabled',function(){return type==='custom'?false:true})

			ampSliders.enter().append('input')
			.attr('id',function(d,i) {return i;})
			.attr('value',function(d) {return d/amp_scaling;})
			.attr('type','number')
			.attr('min','-1')
			.attr('max','1')
			.attr('step','0.05')
			.style('width','200px')
			.style('text-align','center')
			.property('disabled',function(){return type==='custom'?false:true})
			.classed('c2_amp_slider',true)

			ampSliders.exit().remove();
		}
		
		if (!animating){return;}

		step++;

		if(step>=ani_steps){step=0;}

		//DATA JOIN
		circles = circlesGroup.selectAll('circle').data(amp);
		//UPDATE
		circles
			.attr('cx',function(d,i){return pos.x[i][step];})
			.attr('cy',function(d,i){return pos.y[i][step];})
			.attr('r',function(d){return Math.abs(d);});
		//ENTER
		circles.enter().append('circle')
			.attr('id','sine')
			.attr('cx',function(d,i){
				return x_off+CosSum(amp,freq,i,0);
			})
			.attr('cy',function(d,i){
				return y_off-SinSum(amp,freq,i,0);;
			})
			.attr('r',function(d){return Math.abs(d);})
		//EXIT
		circles.exit().remove();
		
		amp_line
			.attr('y1',pos.y[terms-1][step])
			.attr('x2',pos.x[terms-1][step])
			.attr('y2',pos.y[terms-1][step]);

		trace_y.push(trace_y.shift());

		trace_line.attr("d", trace_linefunc(trace_y));

		if(initialize){
			animating=false;
			ani_updating=false;
			return;
		}
		Animate(false);
	},ani_delay);
};

var Recaclulate = function(){
	//Recalculate and update chart based on new parameters
	GenSeries(type);
	GenPos();
	step=0;
	trace_y = pos.y[terms-1].slice(0);
	trace_y.push(trace_y.shift());
}

//--Interactivity--

svg.on("click",function(){
	if (animating) {animating=false;}
	else {
		animating=true;
		Animate(false);
	}
});

d3.select('#c2_terms_div').on('change',function(){
	var val = d3.select('#c2_terms_slider').property('value');
	d3.select(this).select('label').text(val);
	terms = val;
	ani_updating=true;
	});

d3.selectAll('#c2_amp_div').on('change',function(e){
	//*Surely theres a better way!
	custom_amp = [];
	for (var i=1; i<terms; i++){
		var val = parseFloat(d3.select(this).selectAll('.c2_amp_slider:nth-child('+i+')')
			.property('value'))
		if(typeof val !=='number' || isNaN(val)){val=0.0;}
		else if(val>1){val=1;}
		else if(val<-1){val=-1;}
		custom_amp.push(val);
	}
	ani_updating=true;
});

d3.select('#c2_yscale').on('change',function(){
	var old_scaling = amp_scaling;
	amp_scaling = d3.select('#c2_yscale').property('value');
	for(var i=0; i<amp.length; i++){
		amp[i]=amp_scaling*amp[i]/old_scaling;
	}
	ani_updating = true;
});

d3.select('#c2_type').on('change',function(){
	var val = d3.select(this).property('value');
	type = val;
	if(type === 'custom'){
		for(var i=0; i<amp.length; i++){
			custom_amp[i]=amp[i]/amp_scaling;
		}
		d3.select('#c2_amp_div .c2_amp_slider')
			.property('disabled',false);
	}
	else{
		d3.selectAll('#c2_amp_div .c2_amp_slider')
			.property('disabled',true);
	}
	ani_updating=true;
	});

Animate(true);
})();
