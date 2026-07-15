---
date: 2024-04-22
---

<div id="description">
  <p>
    A hackable, programmable badge with E Ink® display, powered by Raspberry Pi
    RP2040.
  </p>
  <p>
    In honour of Raspberry Pi's 10th birthday, we've fused a RP2040
    microcontroller with an EPD display to produce a
    <strong>stylishly monochrome, maker friendly, e-paper badge(r)</strong> to
    attach to your person, your office door or to prop up on your desk.
  </p>
  <p>
    We've equipped Badger 2040 with plenty of <strong>buttons</strong> so you
    can easily change what's displayed on the screen, a slot so you can clip it
    onto a lanyard and a <strong>battery connector</strong> so you can keep
    things portable and refresh the screen whilst on the go. On the back, you'll
    find some funky badgerpunk stylings plus our RP2040 accoutrements of choice:
    boot and reset buttons and a Qw/ST connector so it's super easy to plug in
    <a href="https://shop.pimoroni.com/collections/qwiic">Qwiic</a>
    or
    <a href="https://shop.pimoroni.com/collections/stemma-qt">STEMMA QT</a>
    breakouts
  </p>
  <p>Here are some things you could do with it!</p>
  <ul>
    <li>
      Switch between images, pronouns or secret identities at the push of a
      button
    </li>
    <li>
      Make yourself into a mobile weather station or air quality monitor (by
      adding a sensor breakout)
    </li>
    <li>
      Store important QR codes for getting into places (or to Rickroll people)
    </li>
    <li>Make a tiny to-do list and tick stuff off</li>
    <li>
      Display inspirational badger quotes or educational badger facts of the day
    </li>
  </ul>
  <p>
    Want to show your Badger the world? We've put together a convenient
    <strong>Badger + Accessory Kit</strong> which contains batteries, a lanyard
    and everything else that's needed to get portabello.
  </p>
  <p>p.s. 🦡🦡🦡🦡🍄🍄🐍</p>
  <h2>RP2040 x e Ink®</h2>
  <p>
    We're
    <a href="https://shop.pimoroni.com/?q=inky">big fans of electronic paper</a>
    at Pirate HQ - it makes for a lovely, crisp, high contrast display that's
    readable even in bright sunlight and it doesn't squirt unnecessary blue
    light into your environs like LCDs do. It's also ultra low power (EPD
    displays only consume power while they're refreshing), and the images on the
    display stick around for a really long time whilst the display is unpowered.
  </p>
  <p>
    Using a RP2040 chip means we can drive the hardware in fun, experimental,
    low level ways. We've written custom drivers for the EPD display that
    prioritise low power consumption whilst enabling lightning fast refresh
    rates.
  </p>
  <h2>Features</h2>
  <ul>
    <li>2.9" black and white E Ink® display (296 x 128 pixels)</li>
    <ul>
      <li>Ultra wide viewing angles</li>
      <li>Ultra low power consumption</li>
      <li>Dot pitch - 0.227 x 0.226 mm</li>
    </ul>
    <li>
      Powered by RP2040 (Dual Arm Cortex M0+ running at up to 133Mhz with 264kB
      of SRAM)
    </li>
    <li>2MB of QSPI flash supporting XiP</li>
    <li>Five front user buttons</li>
    <li>
      Reset and boot buttons (the boot button can also be used as a user button)
    </li>
    <li>White LED</li>
    <li>USB-C connector for power and programming</li>
    <li>JST-PH connector for attaching a battery (input range 2.7V - 6V)</li>
    <li>High-precision voltage reference for battery level monitoring</li>
    <li>Qw/ST (Qwiic/STEMMA QT) connector</li>
    <li>Fully-assembled (no soldering required)</li>
    <li>
      <a
        href="https://cdn.shopify.com/s/files/1/0174/1800/files/badger_2040_schematic.pdf?v=1645702148"
        >Schematic</a
      >
    </li>
    <li>
      <a
        href="https://cdn.shopify.com/s/files/1/0174/1800/files/badgerdiagram.png?v=1647960358"
        >Mechanical drawing</a
      >
    </li>
    <li>
      <a href="https://github.com/pimoroni/pimoroni-pico">C++</a>/<a
        href="https://github.com/pimoroni/badger2040"
        >MicroPython</a
      >
      libraries
    </li>
  </ul>
  <h2>Badger + Accessory Kit includes</h2>
  <ul>
    <li>Badger 2040</li>
    <li>2 x AAA battery holder</li>
    <li>2 x AAA batteries</li>
    <li>Velcro square</li>
    <li>Black lanyard (made from recycled plastic bottles!)</li>
    <li>USB-C to USB-A cable</li>
  </ul>
  <h2>Software</h2>
  <p>
    Because it's a RP2040 board, Badger 2040 is firmware agnostic! You can
    program it with C/C++, MicroPython or CircuitPython. We'd recommend using
    our batteries included MicroPython build for ease of getting started.
  </p>
  <p>
    <span data-mce-fragment="1"
      >You can draw on the screen using our lightweight PicoGraphics library,
      which includes functions for displaying text, shapes and images (plus
      individual pixels of course), and we've provided some examples to get you
      started.</span
    >
  </p>
  <p>
    <span data-mce-fragment="1"
      >Badger ships <strong>pre-loaded with MicroPython</strong> and our
      BadgerOS suite of examples.</span
    >
  </p>
  <p><strong>MicroPython</strong></p>
  <ul>
    <li>
      <a
        href="https://learn.pimoroni.com/article/getting-started-with-badger-2040"
        >(Learn) Getting Started with Badger 2040 (and W)</a
      >
    </li>
    <li>
      <a href="https://github.com/pimoroni/badger2040"
        >(Readme) Installation instructions</a
      >
    </li>
    <li>
      <a href="https://github.com/pimoroni/badger2040/releases"
        >Download Badger flavoured MicroPython (with Badger OS examples)</a
      >
    </li>
    <li>
      <a
        href="https://github.com/pimoroni/badger2040/blob/main/docs/reference.md"
        >Badger 2040 function reference</a
      >
    </li>
    <li>
      <a
        href="https://github.com/pimoroni/pimoroni-pico/tree/main/micropython/modules/picographics"
        >PicoGraphics function reference</a
      >
    </li>
  </ul>
  <p><strong>C/C++</strong></p>
  <ul>
    <li>
      <a
        href="https://github.com/pimoroni/pimoroni-pico/tree/main/examples/badger2040"
        >C++ examples</a
      >
    </li>
    <li>
      <a
        href="https://github.com/pimoroni/pimoroni-pico/tree/main/libraries/pico_graphics"
        >PicoGraphics function reference</a
      >
    </li>
  </ul>
  <p>
    You can also use <strong>CircuitPython</strong> on your Badger 2040.
    CircuitPython drivers are designed to work on a bunch of different
    microcontrollers so you won't get the fancy RP2040-architecture specific
    tweaks that you'll find in our library, but you will get access to all the
    nice conveniences of Adafruit's ecosystem.
  </p>
  <ul>
    <li>
      <a href="https://circuitpython.org/board/pimoroni_badger2040/"
        >Download CircuitPython for Badger 2040</a
      >
    </li>
    <li>
      <a href="https://learn.adafruit.com/welcome-to-circuitpython"
        >Getting Started with CircuitPython</a
      >
    </li>
    <li>
      <a
        href="https://github.com/pimoroni/pico-circuitpython-examples/tree/main/badger2040"
        >CircuitPython examples</a
      >
    </li>
    <li>
      <a href="https://github.com/beboxos/circuitpython/tree/main/badger2040"
        >BadgerOS ported to CircuitPython by Stephane BeBoX</a
      >
    </li>
  </ul>
  <h2>Connecting Breakouts</h2>
  <p>
    If your breakout has a QW/ST connector on board, you can plug it straight in
    with a
    <a
      href="https://shop.pimoroni.com/products/jst-sh-cable-qwiic-stemma-qt-compatible"
      >JST-SH to JST-SH cable</a
    >, or you can easily connect any of our I2C Breakout Garden breakouts with a
    <a
      href="https://shop.pimoroni.com/products/jst-sh-cable-qwiic-stemma-qt-compatible"
      >JST-SH to JST-SH cable</a
    >
    coupled with a
    <a
      href="https://shop.pimoroni.com/products/stemma-qt-qwiic-to-breakout-garden-adapter"
      >Qw/ST to Breakout Garden adaptor</a
    >.
  </p>
  <ul>
    <li>
      <a href="https://github.com/pimoroni/pimoroni-pico">List of breakouts</a>
      currently compatible with our C++/MicroPython build.
    </li>
  </ul>
  <h2>Printables<br /></h2>
  <p>
    Want to protect Badger from knocks and scrapes? Check out these nifty 3D
    printable cases and enclosures!
  </p>
  <ul>
    <li>
      <a href="https://www.thingiverse.com/thing:5271558">Badger Guard</a>
      (simple backplate with standoffs)
    </li>
    <li>
      <a href="https://www.thingiverse.com/thing:5280352">Badger 2040 stand</a>
      by samuelmcdermott
    </li>
    <li>
      <a href="https://www.thingiverse.com/thing:5302585"
        >Case for Pimoroni Badger 2040</a
      >
      by hsavior
    </li>
    <li>
      <a href="https://www.printables.com/en/model/167251-badger-2040-enclosure"
        >Badger 2040 enclosure</a
      >
      by Andreas Känner<br />
    </li>
    <li>
      <a href="https://kaenner.de/badger-2040-keypad">Badger 2040 keypad</a>
      by <span data-mce-fragment="1">Andreas Känner</span>
    </li>
  </ul>
  <h2>Notes</h2>
  <ul>
    <li>
      Measurements: 85.6mm x 48.7mm x 10mm (L x W x H, including connectors).
      The mounting holes are M2 and 2.9mm in from each edge. The corner radius
      is 3mm.
    </li>
    <li>
      Badger 2040 is fairly accommodating about input voltage (2.7V - 6V), so
      it's possible to use a variety of different batteries and battery packs. A
      <strong>2x AAA battery pack</strong> fits behind Badger nicely
      (double/triple AA and AAA battery packs will also work though).<br />
    </li>
    <li>
      2x AAA<strong> rechargeable (NiMH) batteries</strong> only puts out 2.4V
      which is, strictly speaking, not enough for Badger. However, in our tests
      it keeps on truckin' down to an input voltage of 2.05V (without the LED),
      so if you want to use rechargeable batteries that should be fine.
    </li>
    <li>
      Alternatively, you can plug a <strong>LiPo/LiIon battery</strong> into the
      battery connector, with the following caveats. Please only consider this
      if the person wearing the badge is an adult and knows what they're doing
      with LiPos!
    </li>
    <ul>
      <li>
        A solid enclosure or backplate to protect the battery from damage whilst
        being worn is a very good idea
        <span data-mce-fragment="1">(or you could use one of our </span
        ><a
          data-mce-fragment="1"
          href="https://shop.pimoroni.com/products/galleon-400mah-battery"
          >Galleon hard case LiPo batteries</a
        ><span data-mce-fragment="1">)</span>.
      </li>
      <li>
        There's no battery protection included on Badger 2040, so you should
        only use it with LiPo batteries that include internal protection (<a
          href="https://shop.pimoroni.com/products/lipo-battery-pack"
          >all ours do</a
        >).
      </li>
      <li>
        Unlike some of our other boards, Badger 2040 doesn't have battery
        charging circuitry onboard. You'll need an external LiPo charger to
        charge the battery (like a
        <a href="https://shop.pimoroni.com/products/lipo-amigo">LiPo Amigo</a>).
      </li>
    </ul>
    <li>
      With older versions of the Badger firmware, reset behaviour is slightly
      different when running on battery. If you're running on battery power, you
      will need to <strong>tap </strong
      ><strong
        >the reset button on the back, and then hold any of the front
        buttons</strong
      >
      to wake it up and trigger a refresh. With
      <a href="https://github.com/pimoroni/pimoroni-pico/releases/tag/v1.18.5"
        >version 1.18.5</a
      >
      or later of the Badger firmware you won't need to do this.
    </li>
    <li>Never set your password as "mushroom". It is not stroganoff.</li>
  </ul>
  <h2>About RP2040</h2>
  <p>
    Raspberry Pi's RP2040 microcontroller is a dual core ARM Cortex M0+ running
    at up to 133Mhz. It bundles in 264kB of SRAM, 30 multifunction GPIO pins
    (including a four channel 12-bit ADC), a heap of standard peripherals (I2C,
    SPI, UART, PWM, clocks, etc), and USB support.
  </p>
  <p>
    One very exciting feature of RP2040 is the programmable IOs which allow you
    to execute custom programs that can manipulate GPIO pins and transfer data
    between peripherals - they can offload tasks that require high data transfer
    rates or precise timing that traditionally would have required a lot of
    heavy lifting from the CPU.
  </p>
</div>
