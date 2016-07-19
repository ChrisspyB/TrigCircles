(function(){
	/*The script that brings it all together.*/
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
	var animating = false, finished = false;


	/*Note this 0 AND 2pi*/
	for (var i=0; i<=frames; i++){
		x_set.push(x+amp*Math.cos(phase+2*Math.PI*cycles*i/frames));
		y_set.push(y-amp*Math.sin(phase+2*Math.PI*cycles*i/frames));
	}

	var svg = d3.select(div_id).append('svg')
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
			.text(function(d){
				console.log(d);
				return d;});
			});
	// return (
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
		// );
};
var MultiTrig = function(div_id,w,h,amp,cycles,phase,frames,preset){
	var x = w/5, y=h/2;
	var tick=0;
	var frame_length=100/6; // 60fps
	var pos = {x:[],y:[]}; //xy positions of circles; final circle is tracer.
	var animating = false, finished = false;
	var pos;

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
	};
	amp = ScaleAmp(amp,amp_scale);
	phase = ConvertPhase(phase);
	GenXY();
	console.log(pos)
	var svg = d3.select(div_id).append('svg')
		.attr('width',w)
		.attr('height',h);

	var circles=svg.selectAll('circle').data(amp).enter().append('circle')
		.attr('cx',function(d,i){return pos.x[i][tick]})
		.attr('cy',function(d,i){return pos.y[i][tick]})
		.attr('r',function(d,i){return d;});

	var tracer = svg.append('circle')
		.attr('cx',pos.x[amp.length][tick])
		.attr('cy',pos.y[amp.length][tick])
		.attr('r',3);
    var plot_scale_x = d3.scale.linear()
	    .domain([0,frames])
		.range([x+140,w-20]);

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
};

SingleTrig('#small_sin_trace',width,280,280/3,1,0,60,true);
SingleTrig('#small_cos_trace',width,280,280/3,1,Math.PI/2,60,true);
SingleTrig('#sin_interactive',width,280*1.5,280/3,1,0,60,false);

MultiTrig('#sum_threesin',width,280,[1,1/2,1/3,1/4],[1,2,3,4],[0,0,0,0],60,'none');
})();