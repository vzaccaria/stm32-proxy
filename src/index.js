/* eslint quotes: [0], strict: [0] */
var {
    $d, $o, $f, _
} = require('zaccaria-cli')

var {
    go, chan, put, take
} = require('js-csp')

var debug = require('debug')('index')

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
    var test = $o('-t', '--test', false, o)
    return {
        help, port, proto, test
    }
}

function* readSize(chan) {
    var s = 0
    s = s * 256 + (yield take(chan)).data
    s = s * 256 + (yield take(chan)).data
    s = s * 256 + (yield take(chan)).data
    s = s * 256 + (yield take(chan)).data
    debug(`computed ${s}`)
    return s
}

function* dataConsumer(chan) {
    debug(`dataConsumer started`);
    var prev = yield take(chan)
    var cur = yield take(chan)
    for (;;) {
        while (cur.data !== 90 || prev.data !== 86) {
            debug(JSON.stringify(cur, 0, 4));
            prev = cur;
            cur = yield take(chan)
        }
        var s = yield* readSize(chan)
        debug(`read header size ${s}`)
        process.exit(0)
    }
}



function* putDataOnChan(chan, data) {
    for (var i = 0; i < data.length; i++) {
        yield put(chan, {
            data: data[i]
        })
    }
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
    go(dataConsumer, [innerChan])
    return innerChan;
}

var main = () => {
    $f.readLocal('docs/usage.md').then(it => {
        var {
            help, port, test
        } = getOptions(it);
        if (help) {
            console.log(it)
        } else {
            var innerChan = startCSP();
            if (!test) {
                registerSerialListener(port, 9600, (data) => {
                    go(putDataOnChan, [innerChan, data])
                })
            } else {
                //                       V   Z  s1 s2 s3 s4  payload
                var tstData = [0, 0, 0, 86, 90, 0, 0, 0, 3, 11, 12, 13]
                var buf = new Buffer(tstData);
                debug(`Start test`);
                go(putDataOnChan, [innerChan, buf]);
            }
        }
    })
}

main()
