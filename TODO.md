### TODO

* import?export list from plain text - has to be one entry per line.
* add/verify deeplink support and sharing
* update docs on how to enable deeplink support manaully in android since we are not verified nor trusted by anyone.
* add item categories to better organize the list
* study how to deploy to fdroid


### DONE

* share list by creating qrcode and adding by scanning qrcode: has to be done with a library that does not use propietary code - i know some qrcode scanners for capcitor leverage google play services which are not always there if you consider pure lineageos.
* add the ability to edit entries - swipe gesture will display also an edit option as well as the already existing trash bin
* checked items should go at the bottom of the list
* if someone disconnects the counter doesn't go down - if it reconnects the counter goes up een if its the same client 
* handle collisions: if someone modifies the list while the the others are disconnected is the last modification that wins during re-sync.
* unify and correct the docs: developing instructions, user instructions, standard contributing instrctions, etc.
* create koinonia public wss server codebase
* deploy koinonia server instance
* bugfix: newly created lists are not immediatly visibile once going back to the home - they do only after app cose and reopen.
* fix icon not displaying on pixel 6 android 16
* integrate an automated versioning tool - use date versioning 
* automated github actions pipelines to build stable releases from master branch and nightly releases from develop branch.