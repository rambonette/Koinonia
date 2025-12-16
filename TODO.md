### TODO

* create koinonia public wss server codebase
* deploy koinonia server instance
* add/verify deeplink support and sharing
  * update docs on how to enable deeplink support manaully in android since we are not verified nor trusted by anyone.
* integrate an automated versioning tool - use date versioning 
* automated github actions pipelines to build stable releases from master branch and nightly releases from develop branch.
* study how to deploy to fdroid


### DONE

* if someone disconnects the counter doesn't go down - if it reconnects the counter goes up een if its the same client 
* handle collisions: if someone modifies the list while the the others are disconnected is the last modification that wins during re-sync.
* unify and correct the docs: developing instructions, user instructions, standard contributing instrctions, etc.