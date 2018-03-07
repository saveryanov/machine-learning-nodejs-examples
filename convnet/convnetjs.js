var convnetjs = require('convnetjs');
var fs = require('fs');
require('console.table');

var summary = require('./traindata/summary.json');

// Shuffles array in place
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}


const apartments_norm_coef = 1;
const train_data_percent = 0.7;
const periods = 4;


// ---------------------------------------------- PREPAIR TRAIN DATA ----------------------------------------------
var train_data_full = [];
Object.keys(summary.data.summary).forEach(block_id => {
    var block = summary.data.summary[block_id];
    
    var document = [];
    var expectation = 0;
    if (block.anomaly && block.anomaly[0] != undefined) 
        expectation = block.anomaly[0];

    for (let i = 0; i < periods; i++) {
        if (block.apartments_sold[i] !== undefined) {
            document.push(block.apartments_sold[i]/apartments_norm_coef);
        } else {
            document.push(0);
        }
        if (block.apartments_stocked[i] !== undefined) {
            document.push(block.apartments_stocked[i]/apartments_norm_coef);
        } else {
            document.push(0);
        }
    }

    train_data_full.push({expectation: expectation, document: document});
});

var train_data_balanced = [];
var class0_len = train_data_full.filter(v => !v.expectation).length;
var class1_len = train_data_full.filter(v => v.expectation).length;
if (class0_len > class1_len) {
    train_data_balanced.push(...train_data_full.filter(v => v.expectation));
    train_data_balanced.push(...train_data_full.filter(v => !v.expectation).slice(0, class1_len));
} else {
    train_data_balanced.push(...train_data_full.filter(v => !v.expectation));
    train_data_balanced.push(...train_data_full.filter(v => v.expectation).slice(0, class0_len));
}
shuffle(train_data_balanced);
var train_data = train_data_balanced.slice(0, Math.floor(train_data_balanced.length * train_data_percent));
var test_data = train_data_balanced.slice(Math.floor(train_data_balanced.length * train_data_percent) + 1, train_data_balanced.length);



// ---------------------------------------------- DEFINE NN ----------------------------------------------

var layer_defs = [];
layer_defs.push({type:'input', out_sx: 1, out_sy: 1, out_depth: periods * 2});
layer_defs.push({type:'fc', num_neurons: 20, activation:'relu'}); 
//layer_defs.push({type:'fc', num_neurons: 25, activation:'sigmoid'}); 
layer_defs.push({type:'softmax', num_classes:2});

var net = new convnetjs.Net();
net.makeLayers(layer_defs);

function evaluate (net, test_data, epoch, best_result) {
    shuffle(test_data);
    var right = 0;
    test_data.forEach(v => {
        // forward a random data point through the network
        var x = new convnetjs.Vol(v.document);
        var prob = net.forward(x);
        
        var result = 0;
        if (v.expectation) {
            if (prob.w[1] > 0.5)
                result = 1;
            else
                result = 0;
        } else {
            if (prob.w[0] > 0.5)
                result = 0;
            else 
                result = 1;
        }

        //console.log("res: " + result + "; exp: " + v.expectation);

        if (result == v.expectation) {
            right++;
        } else {
            /*
            console.table([{
                'result': result, 
                'prob': prob.w[1],
                'expectation': v.expectation, 
                'doc': v.document
            }]);
            */
        }
    });
    //console.log('Eval #' + epoch + ': ' + right + '/' + test_data.length + '(' + (right/test_data.length) + ') lr: ' + learning_rate + '; best: ' + best_result);

    if (epoch % 50 == 0) {
        console.table([{
            'epoch': epoch, 
            'right': right, 
            'total': test_data.length, 
            'eval': (right/test_data.length), 
            'best result': best_result}]
        );
    }

    return right/test_data.length;
}

console.log("Start train network...");


var last_epoch_result = evaluate(net, test_data, -1);
var best_net = net.toJSON();
var best_result = last_epoch_result;
for (var epoch = 0; epoch < 1000; epoch++) {
    //let trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, l2_decay:0.001});
    let trainer = new convnetjs.Trainer(net, {method: 'adadelta', l2_decay: 0.001, batch_size: 10});
    //let trainer = new convnetjs.Trainer(net, {method: 'adagrad', l2_decay: 0.001, l1_decay: 0.001, batch_size: 10});
    shuffle(train_data);
    
    train_data.forEach(v => {
        trainer.train(new convnetjs.Vol(v.document), v.expectation); // train the network, specifying that x is class zero
    });
    let new_epoch_result = evaluate(net, test_data, epoch, best_result);

    if (best_result < new_epoch_result) {
        best_result = new_epoch_result;
        best_net = JSON.stringify(net.toJSON());
    }
}


var net2 = new convnetjs.Net(); // create an empty network
net2.fromJSON(JSON.parse(best_net)); // load all parameters from JSON
console.log("BEST NET: " + evaluate(net2, test_data, 0, 0, 0));

fs.writeFile("./net_" + best_result + ".json", best_net, function(error) {
    if(error) {
        return console.log(error);
    }
    console.log("best_net saved");
}); 