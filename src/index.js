/* eslint quotes: [0], strict: [0] */
var {
    $d, $o, $f, $b
} = require('zaccaria-cli')

var {
    go, chan, put, take
} = require('js-csp')

var pb = require('protobufjs')
pb = $b.promisifyAll(pb)

var debug = require('debug')('index')

// var util    = require('util')
var hex = require('hex')

var serialport = require("serialport")

var ByteBuffer = require("bytebuffer")

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
    var vec = [0, 0, 0, 0];
    vec[0] = (yield take(chan)).data;
    vec[1] = (yield take(chan)).data;
    vec[2] = (yield take(chan)).data;
    vec[3] = (yield take(chan)).data;
    debug("vec = " + JSON.stringify(vec));
    s = s * 256 + vec[3]
    s = s * 256 + vec[2]
    s = s * 256 + vec[1]
    s = s * 256 + vec[0]
    debug(`computed ${s}`)
    return s
}

function* dataConsumer(chan, builder) {
    debug(`dataConsumer started`);
    var pct = builder.build("pct")
    for (;;) {
        var prev = yield take(chan)
        var cur = yield take(chan)
        debug('first two character received')

        while (cur.data !== 90 || prev.data !== 86) {
            debug(JSON.stringify(cur, 0, 4));
            prev = cur;
            cur = yield take(chan)
        }
        var s = yield * readSize(chan)
        debug(`read header size ${s}`)
        var buf = new ByteBuffer(s)
        for (var i = 0; i < s; i++) {
            var read = (yield take(chan)).data;
            buf.writeByte(read, i)
        }
        var msg = pct.decode(buf)
        debug("msg = " + JSON.stringify(msg));
    }
}



function* putDataOnChan(chan, data, builder) {
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
        serialPort.on('data', (data) => {
            f(data)
        })
    })
}

function startCSP(builder) {
    var innerChan = chan()
    go(dataConsumer, [innerChan, builder])
    return innerChan;
}

var main = () => {
    $f.readLocal('docs/usage.md').then(it => {
        var {
            help, port, test, proto
        } = getOptions(it);
        if (help) {
            console.log(it)
        } else {
            pb.loadProtoFileAsync(proto).then((builder) => {
                var innerChan = startCSP(builder);
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
            })
        }
    })
}

main()
