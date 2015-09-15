/* eslint quotes: [0], strict: [0] */
var {
    $d, $o, $f, _
} = require('zaccaria-cli')

var {
    go, chan, put, take
} = require('js-csp')

// var util = require('util')
// var hex = require('hex')

var serialport = require("serialport")

var SerialPort = serialport.SerialPort

var getOptions = doc => {
    "use strict"
    var o = $d(doc)
    var help = $o('-h', '--help', false, o)
    var proto = o.PROTO
    var port = $o('-p', '--port', '/dev/cu.usbmodemfd123', o)
    return {
        help, port, proto
    }
}

function* dataConsumer(chan) {
    while (true) {
        var dt = yield take(chan)
        console.log(JSON.stringify(dt, 0, 4));
    }
}

function putDataOnChan(chan, data) {
    _.forEach(data.toString('ascii'), it => {
        put(chan, {
            data: it
        })
    })
}

function registerSerialListener(port, rate, f) {
    var serialPort = new SerialPort(port, {
        baudrate: rate,
        parser: serialport.parsers.raw
    }, false);
    serialPort.open(() => {
        serialPort.on('data', f)
    })
}

function startCSP() {
    var innerChan = chan()
    go(dataConsumer(innerChan))
    return innerChan;
}

var main = () => {
    $f.readLocal('docs/usage.md').then(it => {
        var {
            help, port, proto
        } = getOptions(it);
        if (help) {
            console.log(it)
        } else {
            if (!test) {
                var innerChan = startCSP();
                registerSerialListener(port, 9600, (data) => {
                    putDataOnChan(innerChan, data)
                })
            } else {
                var buf = new Buffer(10);
                buf.write("abcdefghj", 0, "ascii");
                putDataOnChan(innerChan, buf);
            }
        }
    })
}

main()
