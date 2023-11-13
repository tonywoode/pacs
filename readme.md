# Proxy and Cache Tool

![PACS usage diagram](PACS.png?raw=true "PACS usage diagram")

The idea behind this unfinished project was to provide a WebDAV server to a retro frontend, transparently, so that files that don't exist on the local machine can be retrieved as they are needed. 

## Findings

### Forward PACS (app.js)
Its a priority to protect the ‘local browsing’ experience of a frontend. This isn’t possible with ‘forward-pacs’ (where we look to the remote folder first, but load the local version of a file if it exists when requested) since it must PROPFIND every single thing (assets like screenshots are tightly bound to game sets a lot of the time (the assets will be in a bundle of files with the game). Romdata and asset lookups make browsing very slow.  A ‘remote only’ experience when browsing games in a frontend isn't appropriate, and 'forward pacs' is very much like 'remote only' up to the point of playing games. More specifically, the frontend experience is awful due to:

  * number of PROPFINDs - whole paths are individually subject to PROPFINDs at every level to find out whether a single file exists in the leaf
  * verbosity of PROPFINDs - often in bad connection situations, we lookup screenshots and other assets from multiple massive folders, we retry and so on.
  * HTTP 1.1 we must reuse the TCP connection or things are too slow (particularly on macOS), but are then subject to sync blocking calls
  * the nature of WebDAV XML - to get the information needed is quite a painful process due to the age of the xml forms vs modern parsers. The PROPFIND xmls size, and retrieving them at every level of the filepath does not engender WebDAV

### Reverse PACS (reverseApp.js)
Preferred option

  * only looking remotely if a file doesn't exist locally is non-viable: largely because of PROPFINDs in directories: consider: if the local directory doesn’t contain the file you want, on many clients the PROPFIND will fail. Indeed NetDrive will not be able to tell anything downstream of itself what file it was looking for, since it will just fail if a PROPFIND on the parent dir states the file doesn't exist. NetDrive had this to say about that behaviour:

  > As you might have already noticed, NetDrive supports variety of protocols including WebDAV. So it is implemented to serve protocols that are not supposed themselves to retrieve information of a single file.

Which means we cannot 'reverse-pacs' without either pre-caching directory information (PACS was supposed to negate that need, which forms part of my current solution) or modding our frontend, since only the frontend knows what files its asking for. Reverse-pacs requires some solution like a 1kb file to be made by the frontend, after it mkdirp’s the correct path, in order to satisfy a parent-dir PROPFIND that a path exists. Otherwise, how can web-clients be made aware of the file that we want to GET from the remote store?

  * The variability and difference between different WebDAV clients also became a major concern - the idea was to make an Open Source tool that could be independent of any particular client requirements: but differences in the way the clients PROPFIND and GET, multiple issues with Windows’ and Mac WebDAV clients, means we need to get uncomfortably involved. Other examples include the number of registry changes needed to make it ‘compatible’ with even bare HTTP with sensibly-sized files, and folders with large numbers of files (like the MAME folders we need this tool to read) simply will not look up on the Windows WebDav client (a problem I left unresolved). Testing was a major problem due to this, how do you sensibly produce tests when the OS client is a fundamental part

### General

  *  we're too close to a particular cloud-file implementation: the work done so far will only facilitate WebDAV folders over HTTP, there’s a lot of work to go to then allow for HTTPS, SSL, FTP/FTPS, SFTP, VPN, and I realised that it shouldn't be my problem! In order to help users with their retro-games collections, its far better to leave the user to provide a remote and a local folder path to some tool, that then uses the file system of the user’s machine to ensure that files are sycned before use, by tying into the frontend. This puts the onus on other people to sort out how they best make files available, which is a better long-term plan, one example: there is a hard 4GB limit on file transferral over WebDAV. So I decided instead to make a frontend tool that would compare folders.
# Installation

# Windows

PACS is a local webdav server. We'll need to use a webDAV client to map it. Commercial options like [netdrive](https://netdrive.net/) exist that avoid some of the annoying things about the webDAV client offered by default by Microsoft in Windows 10, but you can use Microsoft's client, just make these registry changes:

  * **Enable basic auth only authentication** 
  nix/macOS/Linux are able to map webDAV folders using http, https with a self-signed certificate, and https with ca-authority signed certificate. That's how the Windows client used to work too, but since Windows 7, Microsoft disallow anything but a ca-authority signed certificate to map a WebDav folder. (This is not made very clear when you attempt to make a mapping!). This is'nt very convenient since we want to map a local server on our own machine. In order to map without a ca-signed certificate, we need to edit the registry as described [here](https://forum.synology.com/enu/viewtopic.php?f=164&t=121882&start=15#p461510) and [here](https://support.netdocuments.com/hc/en-us/articles/205212850-WebDAV-as-a-Mapped-Drive). And [here's](https://support.microsoft.com/en-us/help/2123563/office-application-opens-blank-from-sharepoint-webdav-or-site-when-it) the same guide from microsoft for earlier versions of windows; basically just regedit `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters\BasicAuthLevel` and change the value to `2`.  Once you've changed this key, you'll be able to sucessfully map PACS as a drive without windows suggesting that you've made a syntax error

  * **Increase the filesize limit on transfers to the maximum available** 
  Microsoft have a very silly default 50MB largest-filesize limit, WebDAV allows a maximum of 4GB. The solution, as described [here](https://answers.microsoft.com/en-us/ie/forum/ie8-windows_xp/error-0x800700df-the-file-size-exceeds-the-limit/d208bba6-920c-4639-bd45-f345f462934f) and [here](https://community.wd.com/t/error-0x800700df-the-file-size-exceeds-the-limit-allowed/91973/4) is to regedit to `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters\FileSizeLimitInBytes` and change the decimal value to `429496729`, and restart

  * allow folders with a large number of files to satsfy a PROPFIND using the windows client - WIP!
  
# MacOS
The MaxOS native WebDav client is cripplingly slow by default, this may be due to initating a new TCP connection for every request. i didn't get far enough in my investigations to check if using PACS would cure this (it certainly does for the Windows client!). Another compounding factor is the constant propfinds for _DS.Store-type files, which can cause HTTP-hangups. Its highly advisable to use a different client 


