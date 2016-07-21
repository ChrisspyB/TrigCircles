(function(){
'use strict'
var width = 840;

var SingleTrig = function(div_id,w,h,amp,cycles,phase,frames,fixed){
	if(!fixed){
	    amp = parseFloat(d3.select(div_id+'_amp').property('value'));	
	    cycles =  parseFloat(d3.select(div_id+'_cycles').property('value'));	
	    phase =  parseFloat(d3.select(div_id+'_phase').property('value'))*Math.PI;
	}
	var x = w/5, y=h/2, r=amp;
	var tick=0;
	var frame_length=100/6; // 60fps
	var x_set = [], y_set = [];
	var animating = false;


	/*Note this 0 AND 2pi*/
	for (var i=0; i<=frames; i++){
		x_set.push(x+amp*Math.cos(phase+2*Math.PI*cycles*i/frames));
		y_set.push(y-amp*Math.sin(phase+2*Math.PI*cycles*i/frames));
	}

	var svg = d3.select(div_id).insert("svg", ":first-child")
		.attr('width',w)
		.attr('height',h);

	var circle_main = svg.append('circle')
		.attr('cx',x)
		.attr('cy',y)
		.attr('r',r);

	var tracer = svg.append('circle')
		.attr('cx',x_set[tick])
		.attr('cy',y_set[tick])
		.attr('r',4)
		.style('fill','black');

	var line_radial = svg.append('line')
		.attr('x1',x).attr('y1',y)
		.attr('x2',x_set[0])
		.attr('y2',y_set[0]);
	var line_zero = svg.append('line')
		.attr('x1',x).attr('y1',y)
		.attr('x2',x_set[0])
		.attr('y2',y_set[0]);

	var arc = d3.svg.arc()
	    .innerRadius(0)
	    .outerRadius(r/10)
	    .startAngle(Math.PI/2-phase)
	    .endAngle(Math.PI/2-phase)

    var arc_path = svg.append('path')
	    .attr("d",arc)
	    .attr("transform", "translate("+x+","+y+")")
	    .style('fill','blue')
	    .style('opacity','0.5')

    var arc_text = svg.append('text')
    	.attr('x',x+2)
    	.attr('y',y-10)
    	.text('')
    	.style('fill','steelblue')

    var plot_scale_x = d3.scale.linear()
	    .domain([0,frames])
		.range([x+150+40,w-20]);

    var plot = svg.append('g');

	var graphF = d3.svg.line()
		.x(function(d,i){return plot_scale_x(i);})
		.y(function(d){return d;})
		.interpolate('basis');

	var graph = plot.append('path')
		.classed('graph',true);

	var line_y = svg.append('line')
		.attr('x1',x_set[0]).attr('y1',y_set[0])
		.attr('x2',plot_scale_x(0))
		.attr('y2',y_set[0])
		.style('opacity','0');

	var line_x = svg.append('line')
		.attr('x1',plot_scale_x(0))
		.attr('y1',y)
		.attr('x2',plot_scale_x(0))
		.attr('y2',y_set[0])
		.style('stroke','steelblue')
		.style('opacity','0');

	/*Not using axis object as this is easier to animate*/
	var axis_t = svg.append('line')
		.attr('x1',plot_scale_x(0))
		.attr('y1',y)
		.attr('x2',plot_scale_x(frames))
		.attr('y2',y);

	var axis_text = [];

	for (var i=0.5; i<=2; i+=0.5){
		axis_text.push(
			svg.append('text')
	    	.attr('x',plot_scale_x(Math.round(i*frames)/2))
	    	.attr('y',y+20)
	    	.text(i+'\u03C0')
	    	.style('fill','darkred')
	    	.style('text-anchor','middle')
	    	.style('opacity','0')
			);
	}
	var Animate = function(){
		setTimeout(function(){
			if(!animating){return;}
			if(tick>frames){
				tick=0;
				animating=false;
				line_x.style('opacity',0)
				line_y.style('opacity',0)
				axis_text[3].style('opacity','1');
				return;
			}
			else if(tick===0){
				line_x.style('opacity',1)
				line_y.style('opacity',1)
				axis_text[0].style('opacity','0')
				axis_text[1].style('opacity','0')
				axis_text[2].style('opacity','0')
				axis_text[3].style('opacity','0')
			}
			else if(tick>3*frames/4){axis_text[2].style('opacity','1');}
			else if(tick>frames/2){axis_text[1].style('opacity','1');}
			else if(tick>frames/4){axis_text[0].style('opacity','1');}
			tracer
				.attr('cx',x_set[tick])
				.attr('cy',y_set[tick])

			line_radial
				.attr('x2',x_set[tick])
				.attr('y2',y_set[tick])

			var ang = tick*2*cycles*Math.PI/frames
			arc_text.text((ang/Math.PI).toFixed(1)+"\u03C0");
			arc.endAngle(Math.PI/2-ang-phase)
			arc_path.attr("d",arc);

			line_y
				.attr('x1',x_set[tick])
				.attr('y1',y_set[tick])
				.attr('x2',plot_scale_x(tick))
				.attr('y2',y_set[tick]);

			line_x
				.attr('x1',plot_scale_x(tick))
				.attr('x2',plot_scale_x(tick))
				.attr('y2',y_set[tick]);

			graph.attr('d',graphF(y_set.slice(0,tick+1)))
			tick++;
			Animate();		
		},frame_length);
	};
	d3.select(div_id).on('change',function(){
		//Seperate variables to prevent messing with in progress animations.
		var amp = parseFloat(d3.select(div_id+'_amp').property('value'));	
		var cycles =  parseFloat(d3.select(div_id+'_cycles').property('value'));
		var phase =  parseFloat(d3.select(div_id+'_phase').property('value'))*Math.PI;
		d3.select(div_id).selectAll('label')
			.data([(amp/100).toFixed(1),cycles.toFixed(1),(phase/Math.PI).toFixed(1)+"\u03C0"])
			.text(function(d){return d;});
			});
	svg.on("click",function(){
		if (animating) {
			animating=false;
		}
		else {
			if(tick==0 && !fixed){
				//Update with new parameters
			    amp = parseFloat(d3.select(div_id+'_amp').property('value'));	
			    cycles =  parseFloat(d3.select(div_id+'_cycles').property('value'));
			    phase =  parseFloat(d3.select(div_id+'_phase').property('value'))*Math.PI;
			    
			    x_set=[]; y_set=[];
			    for (var i=0; i<=frames; i++){
					x_set.push(x+amp*Math.cos(phase+2*Math.PI*cycles*i/frames));
					y_set.push(y-amp*Math.sin(phase+2*Math.PI*cycles*i/frames));
				}
				r=amp;
			    circle_main.attr('r',r);
			    arc.outerRadius(r/10).startAngle(Math.PI/2-phase);
			    line_zero.attr('x2',x_set[0]).attr('y2',y_set[0]);
			}
			animating=true;
			Animate();
		}
	});
};
var MultiTrig = function(div_id,w,h,xOff,xDrawOff,amp,cycles,phase,frames,scannable,extrawidth){
	if (typeof extrawidth === 'undefined') { extrawidth = 0; }

	var scan=false;
	var x = w/5, y=h/2;
	x+=xOff;
	var tick=0;
	var frame_length=100/6; // 60fps
	var pos = {x:[],y:[]}; //xy positions of circles; final circle is tracer.
	var animating = false;
	var pos;
	var scanAmp;
	var amp_scale = 70;

	var ConvertPhase = function(phase){
		for (var i=0; i<phase.length;i++){
			phase[i] = phase[i]*Math.PI;
		}
		return phase;
	};

	var ScaleAmp = function(amp,scale) {
		for (var i = 0; i < amp.length; i++) {
			amp[i]=amp[i]*scale;
		};
		return amp;
	}
	var GenXY = function(){
		pos = {x:[],y:[]};

		for (var i=0; i<=amp.length; i++){
			pos.x.push([]);
			pos.y.push([]);
			for (var j=0; j<=frames;j++){
				var xval = x;
				var yval = y;
				for(var k=0; k<i; k++){	
					xval+=amp[k]*Math.cos(phase[k]+2*Math.PI*cycles[k]*j/frames);
					yval-=amp[k]*Math.sin(phase[k]+2*Math.PI*cycles[k]*j/frames);
				}
				pos.x[i].push(xval);
				pos.y[i].push(yval);
			}
		}
		scanAmp = pos.y[amp.length].slice(0,frames);
	};
	amp = ScaleAmp(amp,amp_scale);
	phase = ConvertPhase(phase);
	GenXY();
	var svg = d3.select(div_id).insert("svg", ":first-child") 
		.attr('width',w+extrawidth)
		.attr('height',h);

	var circles=svg.selectAll('circle').data(amp).enter().append('circle')
		.attr('cx',function(d,i){return pos.x[i][tick]})
		.attr('cy',function(d,i){return pos.y[i][tick]})
		.attr('r',function(d,i){return Math.abs(d);});

	var tracer = svg.append('circle')
		.attr('cx',pos.x[amp.length][tick])
		.attr('cy',pos.y[amp.length][tick])
		.attr('r',3);
    var plot_scale_x = d3.scale.linear()
	    .domain([0,frames])
		.range([x+xDrawOff,w-20]);

    var plot = svg.append('g');

	var graphF = d3.svg.line()
		.x(function(d,i){return plot_scale_x(i);})
		.y(function(d){return d;})
		.interpolate('basis');

	var graph = plot.append('path')
		.classed('graph',true);
	
	var line_y = svg.append('line');
	var Animate = function(){
		setTimeout(function(){
			if(!animating){return;}

			if(!scan){
				if(tick>frames){
					tick=0;
					animating=false;
					return;
				}
				circles
					.attr('cx',function(d,i){return pos.x[i][tick]})
					.attr('cy',function(d,i){return pos.y[i][tick]})
				line_y
					.attr('x1',pos.x[amp.length][tick])
					.attr('y1',pos.y[amp.length][tick])
					.attr('x2',plot_scale_x(tick))
					.attr('y2',pos.y[amp.length][tick]);
				tracer
					.attr('cx',pos.x[amp.length][tick])
					.attr('cy',pos.y[amp.length][tick])

				graph.attr('d',graphF(pos.y[amp.length].slice(0,tick+1)))
				tick++;
			}else{
				if(tick>=frames){
					tick=0;
				}
				circles
					.attr('cx',function(d,i){return pos.x[i][tick]})
					.attr('cy',function(d,i){return pos.y[i][tick]});

				tracer
					.attr('cx',pos.x[amp.length][tick])
					.attr('cy',pos.y[amp.length][tick])


				line_y
					.attr('x1',pos.x[amp.length][tick])
					.attr('y1',pos.y[amp.length][tick])
					.attr('x2',plot_scale_x(0))//*
					.attr('y2',pos.y[amp.length][tick]);
				graph.attr('d',
					graphF(scanAmp)
					);
				scanAmp.push(scanAmp.shift())
				tick++;
			}
			Animate();
		},frame_length);
	};
	svg.on("click",function(){
		if (animating) {
			animating=false;
		}
		else {
			animating=true;
			Animate();
		}
	});
	if(scannable){
		d3.select(div_id+'_scanbox').on("change",function(){
			tick=0;
			scan=!scan;
		scanAmp = pos.y[amp.length].slice(0,frames);
		})
	}
	return svg;
};
SingleTrig('#small_sin_trace',width,280,280/3,1,0,60,true);
SingleTrig('#small_cos_trace',width,280,280/3,1,Math.PI/2,60,true);
SingleTrig('#sin_interactive',width,280*1.5,280/3,1,0,60,false);

var fourier={
	amp:{
		sawtooth:[],
		triangle:[],
		square:[]
	},
	freqs:[], //[1,2,3,...]
	phases:[] //[0,0,0,...]
};
for(var i=1; i<=20; i++){
	fourier.freqs.push(i);
	fourier.phases.push(0);
	fourier.amp.sawtooth.push(-1/i);
	fourier.amp.square.push(i%2 ? 1/i : 0);
	var sgn = (i-1)%4 === 0? 1 : -1;
	fourier.amp.triangle.push(i%2 ? sgn/(i*i) : 0);
}
MultiTrig('#fourier_interactive',width,300,60,150,fourier.amp.sawtooth,fourier.freqs,fourier.phases,120,true,0);


var current_slide = 0;
var slides = [
	MultiTrig('#slideshow',width,300,0,210,[1,1],[1,1],[0,0],60,false),
	MultiTrig('#slideshow',width,300,0,210,[1,1],[1,1],[0,1],60,false).attr('display','none'),
	MultiTrig('#slideshow',width,300,0,210,[1,1],[7,8],[0,0],240,true).attr('display','none')
	// MultiTrig('#slideshow',width,300,[1,1],[1,-1],[0,0],60,false).attr('display','none'),
	// MultiTrig('#slideshow',width,300,[1,1/2,1/3,1/4],[1,2,3,4],[0,0,0,0],60,false).attr('display','none')
];
var UpdateCaption = function(){
	d3.select('#slideshow_prog').text((current_slide+1)+' of '+slides.length);
	var str;
	switch(current_slide){
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

	d3.select('#slideshow_caption').html(str);
};
UpdateCaption()



d3.select('#slideshow_fwd')
	.on('click',function(){
		if(current_slide>=slides.length-1){return;}
		else{
			slides[current_slide].attr('display','none');
			current_slide++;
			slides[current_slide].attr('display','inline');
			UpdateCaption()
		}
	});
d3.select('#slideshow_bck')
	.on('click',function(){
		if(current_slide<=0){return;}
		else{
			slides[current_slide].attr('display','none');
			current_slide--;
			slides[current_slide].attr('display','inline');
			UpdateCaption()
		}

	});

})();