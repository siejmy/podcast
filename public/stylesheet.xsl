<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="pl">
      <head>
        <title>Podcast <xsl:value-of select="/rss/channel/title"/></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: Lato, "Helvetica Neue", sans-serif;
            font-size: 14px;
            padding: 1em;
            color: #0c1824;
            line-height: 1.666666;
          }
          a, a:link, a:visited {
            color: #003e82;
            text-decoration: none;
          }
          a:hover {
            color: #003e82;
            text-decoration: underline;
          }
          h1 {
            line-height: 1.25em;
          }
          h1, h2, p {
            margin-top: 0;
            margin-bottom: 15px;
          }
          h2 {
            line-height: 1.25em;
            margin-bottom: 5px;
          }
          .container {
            max-width: 700px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
          }
          header {
            margin-bottom: 20px;
          }
          figure {
            display: block;
            float: right;
            width: 190px;
            margin: 0;
            margin-bottom: 2em;
            margin-left: 2em;
          }
          figure img {
            width: 190px;
            height: auto;
          }
          .item {
            clear: both;
            padding: 1.5em 0;
          }
          audio {
            width: 100%;
          }
          audio:focus {
            outline: none;
          }
          time {
            font-size: 12px;
            color: #545d67;
            margin-bottom: 1em;
          }
          footer {
            margin-top: 4em;
            border-top: 1px solid #ddd;
            padding-top: 0.5em;
            margin-bottom: 6em;
            font-style: italic;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>
              <figure>
                <a>
                  <xsl:attribute name="href">
                    <xsl:value-of select="/rss/channel/image/link"/>
                  </xsl:attribute>
                  <img>
                    <xsl:attribute name="src">
                      <xsl:value-of select="/rss/channel/image/url"/>
                    </xsl:attribute>
                    <xsl:attribute name="title">
                      <xsl:value-of select="/rss/channel/image/title"/>
                    </xsl:attribute>
                  </img>
                </a>
              </figure>
              Podcast
              <xsl:value-of select="/rss/channel/title"/>
            </h1>
            <p>
              <xsl:value-of select="/rss/channel/description"/>
            </p>
            <p>
            <i>
              Podcast tworzy
              <a>
                <xsl:attribute name="href">
                    <xsl:value-of select="/rss/channel/maintainer/link"/>
                </xsl:attribute>
                <xsl:value-of select="/rss/channel/maintainer/name"/>
              </a>
             w ramach grupy
              <a>
                <xsl:attribute name="href">
                    <xsl:value-of select="/rss/channel/maintainer/group/link"/>
                </xsl:attribute>
                <xsl:value-of select="/rss/channel/maintainer/group/name"/>
              </a>
              </i>
            </p>
          </header>
          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <h2>
                <a>
                  <xsl:attribute name="href">
                    <xsl:value-of select="link"/>
                  </xsl:attribute>
                  <xsl:attribute name="target">_blank</xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h2>
              <time>
                <span><xsl:value-of select="pubDate" /></span> &#x02022;
                <span><xsl:value-of select="format-number(floor(itunes:duration div 60), '0')" /> minutes</span>
              </time>
              <p>
                <xsl:value-of select="description" disable-output-escaping="yes"/>
              </p>
              <audio controls="true" preload="none">
                <xsl:attribute name="src">
                <xsl:value-of select="enclosure/@url"/>
                </xsl:attribute>
              </audio>
            </div>
          </xsl:for-each>
          <footer>
            <p>
              Niech będzie pochwalony Jezus Chrystus!
            </p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
