const fs = require('fs');
var opn = require('opn');
var parse = require('csv-parse');

var blank_labels = 0;

labels();
manifest();
invoice();
report();

function labels(){
	fs.readFile('orders.csv', function (err, fileData) {
	  parse(fileData, {columns: false, trim: true}, function(err, rows) {
	  	var html = labels_top_html();
	  	var count = 1;
	    for(var i=1; i<rows.length; i++){
	    	var order = rows[i];
	    	if(order[1] != ""){
		    	var postage_type = '1st'

		    	var label_text = create_address(order);
		    	if( (count-1) % 2 == 0){
		    		html = html+even_label(label_text,postage_type);
		    	}
		    	else{
		    		html = html+odd_label(label_text,postage_type);
		    	}

		    	if( count%14 == 0){
		    		html = html+new_page();
		    	}
		    	count++;
		    }
	    }
	    if((count-1) % 2 == 1){						//If we end on an odd number. Close the html tags by inserting empty label
	    	html = html+odd_label("","");
	    }
	    html = html+labels_bottom_html();
	    save_html(html,'public/labels_print.html',function(){
	    	console.log('Completed Labels');
	    	opn('localhost/labels_print', {app: 'chrome'});
	    });
	  })
	});
}

function manifest(){
	fs.readFile('orders.csv', function (err, fileData) {
	  parse(fileData, {columns: false, trim: true}, function(err, rows) {
	  	var html = manifest_top_html();
	  	var count = 1;
	    for(var i=1; i<rows.length; i++){
	    	order = rows[i];
	    	if(order[1] != ""){
		    	var addr1 = order[33];
		    	var zip = order[36];
		    	var postage_type = '1st';
		    	html = html+manifest_row_html(count,postage_type,zip,addr1);
		    	count++;
		    }
	    }
	    var d = new Date();
	    var date = d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
	    html = html+manifest_bottom_html(date);
	    save_html(html,'public/manifest_print.html',function(){
	    	console.log('Completed Manifest');
	    	opn('localhost/manifest_print', {app: 'chrome'});
	    });
	  })
	});
}

function invoice(){
	getOrders(function(orders){
		var html = invoice_top_html();
		for(var i=0; i<orders.length; i++){
			var order = orders[i];
			var first_name = order.first_name;
			var order_number = order.order_number;
			var order_time = order.order_time;
			var address = order.address;
			var postage_type = order.postage_type;
			var subtotal = order.subtotal;
			var shipping = order.shipping;
			var tax = order.tax;
			var discount = order.discount;
			var discount_code = order.discount_code;
			var total = order.total;
			var items = order.items;

			var d = new Date(order_time);
			var formated_order_time = d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' at '+('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);

			html = html + invoice_html(first_name,order_number,formated_order_time,address,postage_type,subtotal,shipping,discount,discount_code,tax,total,items);
		}
		html = html + invoice_bottom_html();
		save_html(html,'public/invoice_print.html',function(){
    	console.log('Completed Invoices');
    	opn('localhost/invoice_print', {app: 'chrome'});
    });
	});	
}

function report(){
	getOrders(function(orders){
		var main_total = 0;
		var ad_spend = 210.00;
		var flavours_total = {
			'Chocolate Chip':0,
			'Triple Chocolate':0,
			'Salted Caramel & Honeycomb':0,
			'Nutella & Kinder Bueno':0,
			'Smore':0,
			'White Chocolate Chip':0,
			'Birthday Cake':0,
			'Chocolate Caramel Crunch':0
		};
		var big_flavours_total = {
			'Chocolate Chip - Edible Cookie Dough- 12oz':0,
			'Triple Chocolate - Edible Cookie Dough - 12oz':0,
			'Salted Caramel &amp; Honeycomb - Edible Cookie Dough - 12oz':0,
			'Nutella &amp; Kinder Bueno - Edible Cookie Dough - 12oz':0,
			"S'more - Edible Cookie Dough - 12oz":0,
			'White Chocolate Chip - Edible Cookie Dough - 12oz':0,
			'Birthday Cake - Edible Cookie Dough - 12oz':0,
			'Chocolate Caramel Crunch - Edible Cookie Dough - 12oz':0
		};
		var total_produce = { 
			'Chocolate Chip':0,
			'Smore':0,
			'White Chocolate Chip':0,
			'Birthday Cake':0,
			'Salted Caramel & Honeycomb':0,
			'Chocolate Caramel Crunch':0,
			'Triple Chocolate':0,
			'Nutella & Kinder Bueno':0
		};
		var order_count = 0;
		var costs_total = 0;
		for(var i=0; i<orders.length; i++){
			var order = orders[i];
			var items = order.items;
			var total = order.total;
			main_total += parseFloat(total);

			for(var k = 0; k < items.length; k++){
				if(items[k].flavours == undefined){
					var nice_key = items[k].name.split(' -')[0].replace('&amp;','&')
					big_flavours_total[items[k].name] +=items[k].quantity;
					total_produce[nice_key]+=(items[k].quantity*3);
				}
				else{
					for(var j=0; j<items[k].flavours.length; j++){
						flavours_total[items[k].flavours[j]] +=1;
						total_produce[items[k].flavours[j]]+=1;
					}
				}
			}
			order_count++;
		}
		console.log();
		console.log('=== SMALL POTS ===');
		var mini_total = 0;
		for(var key in flavours_total){
			console.log(key+': '+flavours_total[key]);
			mini_total+=flavours_total[key];
			total
		}
		console.log();
		console.log('Total small: '+mini_total);
		console.log();
		console.log('=== BIG POTS ===');
		var big_total = 0;
		for(var key in big_flavours_total){
			console.log(key.split(' -')[0].replace('&amp;','&')+': '+big_flavours_total[key]);
			big_total+=big_flavours_total[key];
		}
		console.log();
		console.log('Total big: '+big_total);
		console.log();
		console.log('=== TOTAL PRODUCE ===');
		// for(var key in total_produce){
		// 	console.log(key+': '+total_produce[key]);
		// }
		// console.log();
		for(var key in total_produce){
			console.log(key+': '+round(total_produce[key]/25));
		}
		console.log();
		console.log();
		console.log('Total Orders: '+order_count);
		console.log();
		console.log('Revenue £'+round(main_total));
		console.log('=====================');
	});	
}

function getOrders(callback){
	var orders = [];
	get_invoice_data('orders.csv',function(all_orders){
		get_invoice_data('flavours.csv',function(flavour_data){
			var i = 1;
			while(i < all_orders.length){
				var o = {};
				o.items = [];
				var order = all_orders[i];
				var order_num = order[0];
				var moreItems = true;
				var stepper = 0;
				var items = [];

				while(moreItems){
					var steppedOrder = all_orders[i+stepper]
					if(steppedOrder == undefined){
						moreItems = false;
					}
					else if(order_num == steppedOrder[0]){
						var item = steppedOrder[17];
						var quantity = parseInt(steppedOrder[16]);
						if(item.includes('Four')){
							var flavours = get_flavours(order_num,flavour_data);
							o.items.push({name:item,flavours:flavours});
						}
						else{
							o.items.push({name:item,quantity:quantity})
						}
						stepper++;
					}
					else{
						moreItems = false;
					}
				}
				o.first_name = order[32].split(' ')[0];
				o.order_number = order[0];
				o.order_time = order[15];
				o.address = create_address(order);
				o.postage_type = order[14];
				o.subtotal = order[7];
				o.shipping = order[8];
				o.tax = order[9];
				o.discount = order[13];
				o.discount_code = order[12];
				o.total = order[11];
				o.order_number = order_num;
				orders.push(o);
				i+=(stepper);
			}
			callback(orders);
		});
	})
}

//getOrders();

function get_all_invoice_data(callback){
	var order_files = [];
	fs.readdir('./', function(err, items) {	 
	    for (var i=0; i<items.length; i++) {
	        if(items[i].includes('.csv')){
	        	order_files.push(items[i]);
	        }
	    }
	    gid(0,order_files,[],function(all_data){
	    	all_data.sort(Comparator);
	    	callback(all_data);
			});
	});
}

function gid(i,order_files,all_data,callback){
	get_invoice_data(order_files[i],function(data){
		var headings = data[0];
		if(headings[42].includes('Product Form')){					//If CSV file contains flavour info
			all_data = all_data.concat(data.slice(1));				//Extract data(except headings)
		}
		i++;
		if(i<order_files.length){
			gid(i,order_files,all_data,callback);
		}
		else{
			callback(all_data);
		}
	});
}

function get_invoice_data(file_name,callback){
	fs.readFile(file_name, function (err, fileData) {
		if(err){
			callback([]);
		}
		else{
		  parse(fileData, {columns: false, trim: true}, function(err, rows) {
		  	if(err){
		  		callback([]);
		  	}
		  	else{
		  		callback(rows);
		  	}
		  });
		}
	});		
}

function create_address(order){
	var address = "";
	var name = order[32];
	var city = order[35];
	var zip = order[36];
	var province = order[37];
	var country = order[38];
	for(var j=33; j<=34; j++){
		var address_part = order[j];
		if(address_part.trim() != ''){
			address = address+address_part;
			address = address+'<br>';
		}
	}
	address = address+city+', '+province+', '+zip+'<br>'+country;
	address = name+'<br>'+address;
	return address;
}

function get_flavours(order_number,flavour_data){
	var num_dough = 4;
	var flavours = [];

	var foundOrder = false;
	var count = 1;
	while(!foundOrder){
		var flavour_order = flavour_data[count];
		if(flavour_order[0] == order_number){
			foundOrder = true;
		}
		else{
			count++;
		}
	}
	var order = flavour_data[count];
	for(var i=43; i<(43+num_dough); i++){				//43 is where flavours start in csv
		flavours.push(order[i]);
	}
	return flavours;
}

function save_html(html,location,callback){
	fs.writeFile(location, html, 'utf8', function(err) {
	    if (err){
	    	console.log(err);
	    	callback();
	    }
	    	callback();
	    }
	);
}



function even_label(address,postage){
	return 	'<div class="row">'+	
				'<div class="label">'+
					'<div class="postage">'+postage+'</div>'+
					'<div class="label-content">'+
						address+
					'</div>'+
				'</div>';
}

function odd_label(address,postage){
	return 		'<div class="label">'+
					'<div class="postage">'+postage+'</div>'+
					'<div class="label-content">'+
						address+
					'</div>'+
				'</div>'+
			'</div>';
}

function new_page(){
	return 	'<div class="bottom-space"></div>'+
			'<div class="top-space"></div>';
}

function labels_top_html(){
	return '<!DOCTYPE html>'+
				'<html>'+
				'<head>'+
					'<title>Labels</title>'+
					'<link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">'+
					'<link rel="stylesheet" type="text/css" href="labels.css">'+
				'</head>'+
				'<body onload="window.print()">'+
					'<div class="top-space"></div>';
}

function labels_bottom_html(){
	return 	'</body>'+
			'</html>';
}

function manifest_top_html(){
	return 	'<!DOCTYPE html>'+
			'<html>'+
			'<head>'+
				'<title>Manifest</title>'+
				'<link href="https://fonts.googleapis.com/css?family=Quicksand" rel="stylesheet">'+
				'<link rel="stylesheet" type="text/css" href="manifest.css">'+
			'</head>'+
			'<body onload="window.print()">'+
				'<div class="top-section">'+
					'<div class="customer-info">'+
						'<div><b>Customer Name: </b>Benjamin Stokes</div>'+
						'<div><b>Contact Phone No: </b>07541076989</div>'+
					'</div>'+
					'<div class="center-img"><img src="img/drop-go-bw.png" class="drop-go"/></div>'+
					'<div class="number"><b>Card Number: </b><u>2</u><u>2</u><u>2</u><u>7</u><u>0</u><u>0</u><u>5</u><u>2</u></div>'+
				'</div>'+
				'<div class="table-section">'+
					'<table>'+
					  '<tr>'+
					    '<th>Item</th>'+
					    '<th>Service Required</th> '+
					    '<th>Post Code</th>'+
					    '<th>Building name/Number</th>'+
					  '</tr>';
}

function manifest_row_html(i,service,postcode,number){
	return	'<tr>'+
			    '<td>'+i+'</td>'+
			    '<td>'+service+'</td> '+
			    '<td>'+postcode+'</td>'+
			    '<td>'+number+'</td>'+
			'</tr>';
}

function manifest_bottom_html(date){
	return 	'</table></div>'+
			'<div class="bottom-section">'+
				'<div class="date"><b>Date: </b>'+date+'</div>'+
				'<div class="signature"><b>Customer Signature: </b><img src="img/signature.png"/></div>'+
				'<div class="date-stamp"><b>Date Stamp: </b><div class="stamp-outline"></div></div>'+
			'</div></body></html>';
}

function invoice_top_html(){
	return 	'<!DOCTYPE html>'+
					'<html>'+
					'<head>'+
						'<title>Invoice</title>'+
						'<link rel="stylesheet" type="text/css" href="invoice.css">'+
					'</head>'+
					'<body onload="window.print()">';
}

function invoice_html(first_name,order_number,order_time,address,postage_type,subtotal,shipping,discount,discount_code,tax,total,items){
	return '<div class="page">'+
		'<div class="invoice">'+
			'<div class="top">'+
				'<img class="logo" src="img/black.png"/>'+
				'<p class="thank-you name">'+first_name+'!</p>'+
				'<p class="thank-you">Thank you so much for purchasing Cheeky Dough! You are AWESOME! 🐵🍪🎉 We are currently only a small independent start-up, so your support means so much to us! Check out the little card in your box to learn how you earn some more FREE Cheeky Dough!</p>'+
				'<p class="thank-you">We hope you love our Cheeky Dough! Make sure to keep it in the fridge for maximum freshness. You can keep store Cheeky Dough for up to 2 weeks in the fridge, or 12 months in the freezer. When you\'re ready to eat, let the dough reach room temperature for the best Cheeky Dough experience!</p><p>If you need to contact us about your dough, use the form at: <b>cheekydough.com/contact</b></p>'+
			'</div>'+
			'<div class="details">'+
				'<h1 class="order-title">Order Invoice</h1>'+
				'<div>Order Number: <b>'+order_number+'</b></div>'+
				'<div>Placed on '+order_time+'</div>'+
				'<div class="addresses">'+
					'<div class="shipping-to">'+
						'<b>SHIPPING TO</b><br>'+
						address+'<br>'+
						'<div class="shipping-method"><b>'+postage_type+'</b></div>'+
					'</div>'+
				'</div>'+
				'<div>'+
					'<h2>Order Summary</h2>'+
					'<div>'+
						items_html(items) +
					'</div>'+
					'<div class="line"></div>'+
					'<div class="totals-section">'+
						'<div class="totals">'+
							'<div class="total-names">'+
								'<div>Item Subtotal</div>'+
								'<div>Shipping & Handling</div>'+
								'<div>Discount'+discount_code_html(discount_code)+'</div>'+
								'<div>Tax</div>'+
								'<div>TOTAL</div>'+
							'</div>'+
							'<div class="total-amounts">'+
								'<div>'+subtotal+'</div>'+
								'<div>'+shipping+'</div>'+
								'<div>'+discount+'</div>'+
								'<div>'+tax+'</div>'+
								'<div><b>'+total+'</b></div>'+
							'</div>'+
						'</div>'+
					'</div>'+
				'</div>'+
				'<div class="site"><b>cheekydough.com</b></div>'+
			'</div>'+
		'</div>'+
	'</div>';
}

function items_html(items){
	var html_string = "";
	for(var i=0; i<items.length; i++){
		if(items[i].flavours == undefined){
			html_string = html_string+'<div class="item-name">'+items[i].name+'</div>';
		}
		else{
			var flavours_html = invoice_flavours_html(items[i].flavours);
			html_string = html_string+'<div class="item-name">'+items[i].name+'</div>'+
			'<div class="items">'+
				flavours_html+
			'</div>'	
		}
	}
	return html_string;
}

function discount_code_html(discount_code){
	if(discount_code != ''){
		discount_code = ' ('+discount_code+')';
	}
	return discount_code;
}

function invoice_flavours_html(flavours){
	var flavours_html = "";
	for(var i=0; i<flavours.length; i++){
		var dough_class = "";
		switch(flavours[i]){
			case "Chocolate Chip": dough_class="chocchip";break;
			case "Triple Chocolate": dough_class="tripchoc";break;
			case "Salted Caramel & Honeycomb": dough_class="caramel";break;
			case "Caramel & Honeycomb": dough_class="caramel";break;
			case "Nutella & Kinder Bueno": dough_class="nutella";break;
			case "Lotus Biscoff": dough_class="biscoff";break;
			case 'Chocolate Peanut Butter': dough_class="reese";break;
			case 'Smore': dough_class="smore";break;
			case 'White Chocolate Chip': dough_class="whitechoc";break;
			case 'Birthday Cake': dough_class="birthday";break;
			case 'Chocolate Caramel Crunch': dough_class="crunchie";break;
		}
		flavours_html = flavours_html + '<div class="dough"><div class="dough-symbol '+dough_class+'"></div><div class="dough-name">'+flavours[i]+'</div></div>'
	}
	return flavours_html;
}

function invoice_bottom_html(){	
	return 	'</body>'+
					'</html>';
}

 function Comparator(a, b) {
   if (a[0] < b[0]) return -1;
   if (a[0] > b[0]) return 1;
   return 0;
 }

 function round(num){
 	return Math.round(num * 100) / 100;
 }


//Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');

const app = express();

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(__dirname + '/public', {
  extensions: ['html']
}));

// Catch all other routes and return the index file
app.get('*', function(req, res){
	res.sendFile(path.join(__dirname, 'public/labels.html'));
});


const server = http.createServer(app);server.listen(process.env.PORT || '80', function(){console.log('Server running')});