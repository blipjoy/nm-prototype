lpcgame
=====

Untitled game for Liberated Pixel Cup
-------------------------------------

Getting
-------

    $ git clone http://bitbucket.org/parasyte/lpcgame.git

License
-------

This code is released to the public under a dual license. The full license texts
are available as follows:

* [GPL V3](gpl-3.0.txt)
* [EXPAT (aka MIT)](COPYING.txt)

Running
-------

### Requirements ###

* A browser supporting HTML5 canvas; Chrome, Safari, Firefox, Opera, ...

### Easy mode ###

Just go to http://parasyte.kodewerx.org/projects/lpcgame/ ;)

### Dev server ###

You can also host the HTML and JavaScript without a full-featured HTTP server
(apache, nginx, lighttpd, ...) is by running a Python SimpleHTTPServer directly
on your development environment:

    $ cd lpcgame
    $ python -m SimpleHTTPServer

Then connect to http://localhost:8000/ in your favorite browser!

Level Editor
------------

Use [Tiled-QT](http://www.mapeditor.org/) to edit the maps.
