## sloth

A static site generator for lazy people

### TODO

* Templates
    * Layout template (?)
    * One template per directory (?)
    * One template per item (?)
* Build various files (coffee, sass, jade, etc)
* Simple post-build file operations (copy, move, link)
* Clean up index page
* Automatic rebuild
* Uploads to S3
* Static files

### Rules.swag

* `SOMETHING.mustache` becomes its own file
* `DIRNAME.mustache` is used as a template for all markdown in a directory
* `SOMETHING.md` becomes its own file
