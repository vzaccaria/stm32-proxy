stm32-proxy
===========

> A supersimple POST request proxy for STM32L0.

What is it
----------

It proxies requests coming from an STM Nucleo Board to the net via USB.
Requests from the board must be encoded through a protobuf and sent over
the serial port.

Install
-------

Install it with

    npm install stm32-proxy

Usage
-----

```
Usage:
    stm32-proxy PROTO [ -p PORT ] [ -g PLUGIN ]
    stm32-proxy ( -h | --help )

Options:
    -h, --help              help for stm32-proxy
    -p, --port PORT         port to use to connect to the stm32
    -g, --plugin PLUGIN     javascript plugin (implements init() and process(data))


Arguments:
    PROTO                   prototype file

```

Author
------

-   Vittorio Zaccaria

License
-------

Released under the BSD License.

------------------------------------------------------------------------


# New features

-     add processing plugins -- [Sep 18th 15](../../commit/2f21fab89768fa8a432d42172b95c3e2ea56a6d9)
-     use js-csp for channels, parse header and packet size -- [Sep 15th 15](../../commit/34c09e9786c5482e000ac129e88025e24e043912)

# Bug fixes

-     add protobuf library to the mix -- [Sep 16th 15](../../commit/629abcb7caf00f370c9bd04a3ae7441128588c92)

# Changes to the build process

-     update docs -- [Sep 16th 15](../../commit/04e1128bd4f6e5a23dbd2507b970af7a90f4991f)
-     initial commit -- [Sep 15th 15](../../commit/f239fb4e996c83f4988435bd349cb5447fc7a231)
