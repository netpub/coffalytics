if (!Date.now) {
	Date.now = function() { return new Date().getTime(); }
}

var coffalytics = (function(){
	var public = {},
		preSets = {
			minute: {
				graphtype: 'datetime',
				additionalOptions: {}
			},
			hour: {
				graphtype: 'datetime',
				additionalOptions: {}
			},
			day: {
				graphtype: 'date',
				additionalOptions: {
					hAxis: {
							format: 'd.M.yy'
					}
				}
			},
			week: {
				graphtype: 'date',
				additionalOptions: {}
			},
			month: {
				graphtype: 'date',
				additionalOptions: {}
			},
			year: {
				graphtype: 'date',
				additionalOptions: {}
			},
		},
		currentSettings = {};

	// init
	public.init = function(){
		// set default settings
		var current = moment();
		currentSettings['start'] = current.startOf('day').valueOf();
		currentSettings['end'] = current.endOf('day').valueOf();
		currentSettings['range'] = 'hour';
		$('.range-day,.range-week,.range-month,.range-year').hide();
		$('.range-hour').addClass('active');

		calcConsumptionData();
		// load graph data
		public.loadGraphData();
	};

	// Loads different data, most consumpion and by hour
	var calcConsumptionData = function() {
		var startDate = new Date(2016, 0, 1, 0, 0, 0).getTime();
		var endDate = new Date().getTime();
		$.ajax({
			url: "data.php",
			dataType: "json",
			data: {
				start: startDate,
				end: endDate
			},
			success: function(resp){
				var hourData = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
				resp.coffees.forEach(function(elem) {
					let _date = new Date(parseInt(elem));
					++hourData[_date.getHours()];
				});

				var dataTable = new google.visualization.DataTable();
				dataTable.addColumn('timeofday', 'Time of Day');
				dataTable.addColumn('number', 'Kaffees');

				var rows = [];
				for (var i = 0; i < hourData.length; i++) {
					rows.push([{ v: [i, 0, 0], f: i+' Uhr' }, hourData[i]]);
				}
				dataTable.addRows(rows);

				var options = {
					height: 350,
					title: 'Kaffeekonsum über den Tag, gesamt',
					hAxis: {
						format: 'h:mm a',
						viewWindow: {
							min: [6, 30, 0],
							max: [18, 30, 0]
						}
					},
					legend: "none"
				};

				var chart = new google.visualization.ColumnChart(document.getElementById('container_graph_by_hour'));
				chart.draw(dataTable, options);

				// Sort consumption by day
				var dayData = {/*	*/};
				resp.coffees.forEach(function(elem) {
					let _date = new Date(parseInt(elem));
					let ts = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate(), 0, 0, 0).getTime();
					if (dayData[ts] === undefined) { dayData[ts] = 0; }
					++dayData[ts];
				});

				// create array that works with Google charts
				var keys = Object.keys(dayData);
				var days = [];
				for (var i = 0; i < keys.length; i++) {
					days.push([ keys[i], dayData[keys[i]] ]);
				}

				// Find highest consumption in the data
				var mostConsumption = { _dates: [], amount: 0 };
				days.forEach(function(elem) {
					if (elem[1] > mostConsumption.amount) {
						mostConsumption = { _dates: [elem[0]], amount: elem[1] };
					} else if (elem[1] == mostConsumption.amount) {
						mostConsumption._dates.push(elem[0]);
					}
				});

				// There's more than one day with the same highest amount
				strConsumption = mostConsumption.amount;
				if (mostConsumption._dates.length > 1) {
					strConsumption += " mal<br>";
					bStart = true;
					mostConsumption._dates.forEach(function(elem) {
						if (!bStart) { strConsumption += "<br>"; }
						else { bStart = false; }
						strConsumption += "- " + moment(parseInt(elem)).format("MMM, Do YYYY");
					});
				} else {	// only a single day
					strConsumption += " mal " + moment(new Date(parseInt(mostConsumption._dates[0]))).format("MMM, Do YYYY");
				}
				updateMostCoffeConsumption(strConsumption);	// set the label to findings
			}
		});
	};

	// Loads the data for the graphs
	public.loadGraphData = function(){
		// show loader
		public.showLoader();
		$.ajax({
			url: "data.php",
			dataType: "json",
			data: {
				start: currentSettings.start,
				end: currentSettings.end,
			},
			success: function(resp){
				var data = public.groupData(resp);
				if(currentSettings['range'] != 'minute'){
					dataWithZeros = public.addZeros(data);
				} else {
					dataWithZeros = 101;
				}
				// only fill zeros, if we don't get over 100 Points
				if(dataWithZeros.length < 100){
					data = dataWithZeros;
				}
				public.updateAmount(resp);	// updates the coffe amount display
				public.drawLineGraph(data);
				public.drawDonutGraph(resp);
				// Hide Loader again
				public.hideLoader();
			}
		});
	}

	// update coffee amount
	public.updateAmount = function(data){
		$('.coffee-amount').text(data.amount);
	}
	// update most coffee consumption
	var updateMostCoffeConsumption = function(text){
		$('.most-coffee-amount-date').html(text);
	}

	// group timestamps
	///////////////////////////////////////////////////////////////////////////
	var occurrenceTime= function(occurrence){
		return moment(occurrence,'x').startOf(currentSettings['range']).valueOf();
	};

	var groupToTime = function(group, time){
		return [
			Number(time),group.length
		];
	};

	// Groups the data with underscore functionas
	public.groupData = function(data){
		var result = _.chain(data.coffees)
			.groupBy(occurrenceTime)
			.map(groupToTime)
			//.sortBy('day')
			.value();
			return result;
	}

	// prevents gaps in the chart by adding zeroes where necessary
	public.addZeros = function(data){
		var s = currentSettings['start'];
		var e = currentSettings['end'];
		var a = [];
		var range = moment.range(s, e);
		var filled = [];
		a = range.toArray(currentSettings['range']+'s');
		for(var i = 0; i < a.length; i++){
			var item = false;
			var rangedate = Number(moment(a[i]).valueOf());
			for(var j = 0; j < data.length; j++){
				if(data[j][0] == rangedate){
					item = data[j];
				}
			}
			if(!item){
				item = [rangedate,0]
			}

			filled.push(item);
		}
		return filled;
	}
	///////////////////////////////////////////////////////////////////////////

	// draw the chart
	public.drawLineGraph = function(groupedData){
		// Incoming data
		var data = new google.visualization.DataTable();
		var settings = preSets[currentSettings['range']];
		data.addColumn('number', 'Count');
		data.addColumn('number', 'Kaffees');
		data.addRows(groupedData);

		// Redefine as dates
		var view = new google.visualization.DataView(data);
		view.setColumns([{
				type: settings['graphtype'],
				calc: function(dt, row) {
						return new Date(dt.getValue(row, 0));
				}
		}, 1])

		// Set chart options
		var options = $.extend({
			height: 300,
			pointSize: 8,
			series: {
				0: { color: '#349ac7' }
			},
			vAxis: {
				//gridlines: {color: 'none'},
				minValue: 0,
				//format: '#'
			}
		},settings['additionalOptions']);

		// Instantiate and draw our chart, passing in some options.
		var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
		chart.draw(view, options);
	};

	// Displays the consumption by day
	public.drawDonutGraph = function(data) {
		// Loop each date we got, create date object and add 1 to the respective day
		var dayData = {"Sonntag" : 0, "Montag": 0, "Dienstag": 0, "Mittwoch": 0, "Donnerstag": 0, "Freitag": 0, "Samstag": 0};
		var days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
		data.coffees.forEach(function(elem) {
			let _date = new Date(parseInt(elem));
			++dayData[days[_date.getDay()]];
		});
		var dataTable = [["Tage", "Kaffee"]];
		days.forEach(function(elem) {
			dataTable.push([elem, dayData[elem]]);
		});
		var data = google.visualization.arrayToDataTable(dataTable);
		var options = {
			height: 350, pieHole: 0.5,
			pieSliceTextStyle: { color: 'black' },
			legend: 'display'
		};

		var chart = new google.visualization.PieChart(document.getElementById('container_graph_donut'));
		chart.draw(data, options);
	};

	// date range
	$('input[name="daterange"]').daterangepicker({
		ranges: {
			'Heute': [moment(), moment()],
			'Gestern': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Letzte 7 Tage': [moment().subtract(6, 'days'), moment()],
			'Letzte 30 Tage': [moment().subtract(29, 'days'), moment()],
			'Dieser Monat': [moment().startOf('month'), moment().endOf('month')],
			'Letzter Monat': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
		},
		alwaysShowCalendars: true,
		locale: {
			format: 'DD.MM.YYYY',
			applyLabel: 'Anwenden',
			cancelLabel: 'Abbrechen',
			daysOfWeek: ['So','Mo','Di','Mi','Do','Fr','Sa'], // stupid, moment js has this built in....
			monthNames: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
		},
		opens: 'left'
	});

	$('.daterange-wrap button').click(function(e){
		e.preventDefault();
		if(!$('.daterange-wrap').hasClass('open')){
			$('input[name="daterange"]').focus();
		}
	});

	// start-stop change
	$('input[name="daterange"]').on('apply.daterangepicker', function(e,picker){
		startdate = moment(picker.startDate);
		enddate = moment(picker.endDate);
		currentSettings['start'] = startdate.startOf('day').valueOf();
		currentSettings['end'] = enddate.endOf('day').valueOf();

		// not only 1 day
		if(startdate.startOf('day').format('MM-DD-YYYY') != enddate.endOf('day').format('MM-DD-YYYY')){
			$('.range-day,.range-week,.range-month,.range-year').show();
		} else {
			$('.range-day,.range-week,.range-month,.range-year').hide();
			if(currentSettings['range'] != 'minute' && currentSettings['range'] != 'hour'){
				$('.range-hour').click();
				return;
			}
		}
		public.loadGraphData();
	});
	$('input[name="daterange"]').on('show.daterangepicker', function(e,picker){
		$(this).parents('.daterange-wrap').addClass('open');
	});
	$('input[name="daterange"]').on('hide.daterangepicker', function(e,picker){
		$(this).parents('.daterange-wrap').removeClass('open');
	});

	// group rangechange
	$('.range-selector button').click(function(e){
		e.preventDefault();
		var elem = $(this),
				range = elem.data('range');

		$('.range-selector button').removeClass('active');
		elem.addClass('active');
		currentSettings['range'] = range;
		public.loadGraphData();
	});

	// show loader
	public.showLoader = function(){
		$('.loader-overlay').fadeIn(50);
	}

	// hide loader
	public.hideLoader = function(){
		$('.loader-overlay').fadeOut(150);
	}

	return public;
})();

google.charts.setOnLoadCallback(function(){
	coffalytics.init();
});
