# Proxy and Cache Tool

# installation

# Windows
*nix/macOS/Linux are able to map WebDav folders using http, https with self-signed certificate as well as https with ca-authority signed certificate. Since Windows 7, Microsoft disallow anything but a ca-authority signed certificate to map a WebDav folder. (This is not made very clear when you attempt to make a mapping!). This is'nt very convenient since we want to map a local server on our own machine. In order to map without a signed certificate, we need to edit the registry as described here:
https://forum.synology.com/enu/viewtopic.php?f=164&t=121882&start=15#p461510
https://support.netdocuments.com/hc/en-us/articles/205212850-WebDAV-as-a-Mapped-Drive
here's the same guide from microsoft for earlier versions of windows:
https://support.microsoft.com/en-us/help/2123563/office-application-opens-blank-from-sharepoint-webdav-or-site-when-it
Once you've changed this key, you'll be able to sucessfully map PACS as a drive without windows suggesting that you've made a syntax error

