#!/usr/bin/env node

const VERSION = "0.3.1"
const NAME = "Turbo Crawl"
import chalk from "chalk"
import { readFileSync } from "fs"
import { str2url } from "hittp"
import { Server, commands } from "turbocrawl"
import { HOST, PORT } from "./env"

const log = console.log

if (process.argv.length <= 2) {
  commands.ping(PORT, HOST, (success) => {
    if (!success) {
      log(`
${chalk.underline(`${NAME} ${VERSION}`)}

${chalk.blueBright("Here are some commands to get you started:")}

$ ${chalk.reset("tcrawl start &")}  | You probably want to do this first.
                  |
$ ${chalk.reset("tcrawl generate")} | Generates lists of websites for Turbo Crawl to visit.
                  |
$ ${chalk.reset("tcrawl crawl")}    | Begins crawling one or more websites.
                  |
$ ${chalk.reset("tcrawl help")}     | Show a list of all commands.
        `)
    } else {
      log(`
Add a domain name to that command to start crawling the website. Example:
${chalk.reset("$ tcrawl crawl cnn.com")}
              `)
    }
  })
} else {
  const url = str2url(process.argv[2])
  if (url) {
    commands.crawl(PORT, HOST, [url], (statusCode, response) => {
      if (statusCode === 400) {
        log(`Error crawling ${chalk.red(url.href)}`)
      }
      else {
        log(`Crawling ${chalk.greenBright(url.href)}`)
        if (response.filepath) {
          log("Scraper output can be found on the server at " + chalk.greenBright(response.filepath))
        }
      }
    })
  } else {
    const command = process.argv[2]
    if (command === "start") {
      const server = new Server(PORT, HOST)
      server.listen(() => {
        log(chalk.blue(`
    Turbo Crawl Server is now running
      Listening on PORT: ${PORT}
      ${HOST === "0.0.0.0" ? "and is accessible on your network" : "and is available locally"}
      `))
      })
    } else if (command === "shutdown") {
      commands.exit(PORT, HOST)
      log(chalk.greenBright("Buh-Bye Turbo Crawl!"))
    } else if (command === "list") {
      commands.list(PORT, HOST, (crawlerstrings) => {
        log(`
    ${chalk.blueBright("Crawlers:")}
      ${crawlerstrings.length > 0 ? crawlerstrings.join("\n\t\t") : "None. You can use the following command to start a crawl:\n\ttcrawl www.someurlhere.com"}`)
      })
    } else if (command === "pause") {
      const arg = process.argv[3]
      const url = str2url(arg)
      if (url) {
        commands.pause(PORT, HOST, [url], (success) => {
          log((success ?
            chalk.greenBright("Turbo Crawl paused")
            : chalk.redBright("Turbo Crawl failed to pause")), url.href)
        })
      }
    } else if (command === "end") {
      const arg = process.argv[3]
      const url = str2url(arg)
      if (url) {
        commands.end(PORT, HOST, [url], (success) => {
          log((success ?
            chalk.greenBright("Turbo Crawl ended")
            : chalk.redBright("Turbo Crawl failed to end")), url.href)
        })
      }
    } else if (command === "endall") {
      commands.endall(PORT, HOST, (success) => {
        log((success ?
          chalk.greenBright("Turbo Crawl ended all crawlers")
          : chalk.redBright("Turbo Crawl failed to end all crawlers")))
      })
    } else if (command === "resume") {
      const arg = process.argv[3]
      const url = str2url(arg)
      if (url) {
        commands.resume(PORT, HOST, [url], (success) => {
          log((success ?
            chalk.greenBright("Turbo Crawl resumed")
            : chalk.redBright("Turbo Crawl failed to resume")), url.href)
        })
      }
    } else if (command === "resumeall") {
      commands.resumeall(PORT, HOST, (success) => {
        log((success ?
          chalk.greenBright("Turbo Crawl resume all crawlers")
          : chalk.redBright("Turbo Crawl failed to resume all crawlers")))
      })
    }
    else if (command === "generate") {
      const arg = process.argv[3]
      if (!arg || arg.length === 0) {
        log(chalk.blueBright("\nThe generate command:")
        + "\nAutomatically generates lists of websites to be crawled"
        + "\n  tcrawl generate reddit\n    Scrapes news websites from " + chalk.bold.underline("https://www.reddit.com/r/politics/wiki/whitelist")
        + "\n  tcrawl generate wikipedia\n    Scrapes national news websites from "
        + chalk.bold.underline("https://en.wikipedia.org/wiki/Category:News_websites_by_country"))
      } else if (arg === "reddit") {
        log("Scraping", chalk.bold.underline("https://www.reddit.com/r/politics/wiki/whitelist"), "for domain names")
        commands.generate(PORT, HOST, "reddit", (body, err) => {
          let json: any = body || ""
          try { json = JSON.parse(json) }
          catch { 
            log(chalk.redBright("Failed to scrape anything"))
            return
          }
          log(json.count > 0 ?
            chalk.greenBright(`Scraped ${json.count} domain names into ${json.filename}`)
            + "\n  tcrawl crawl random"
            + "\n    Try the above command to randomly crawl a website from this list."
            : chalk.redBright("Failed to scrape anything."))
        })
      } else if (arg === "wikipedia") {
        log("Scraping" + chalk.bold.underline("https://en.wikipedia.org/wiki/Category:News_websites_by_country") + " for domain names"
        + "\nThis will take about 8 minutes. You can ctrl+c out of here if you want and the generation will continue on the server."
        )
        commands.generate(PORT, HOST, "wikipedia", (body, err) => {
          let json: any = body || ""
          try { json = JSON.parse(json) }
          catch {
            log(chalk.redBright("Failed to scrape anything"))
            return
          }
          log(json.count > 0 ?
            chalk.greenBright(`
    Scraped ${json.count} domain names from Wikipedia Category: ${chalk.bold("News websites by country")}`)
            : chalk.redBright(`
    Failed to scrape anything from Wikipedia Category: ${chalk.bold("News websites by country")}`))
        })
      }
    } else if (command === "crawl") {
      let arg = process.argv[3]
      if (!arg || arg.length === 0) {
        log(chalk.blueBright("\nThe crawl command:")
        + "\nSubmits a crawler to the server for execution"
        + "\n  tcrawl crawl www.replacethiswitharealwebsite.com\n    Begins crawling the website sent in as an argument. See server for logs."
        + "\n  tcrawl crawl random\n    Crawls a random news website."
        + "\n  tcrawl crawl american\n    Crawls popular American news websites. Link to full list of countries: https://en.wikipedia.org/wiki/Category:News_websites_by_country"
        + "\n  tcrawl crawl -f filename\n    Pass in a newline-delimited file of domain names to crawl.\n    That means one domain name per line.")
      }
      if (arg === "random") {
        commands.random(PORT, HOST, (statusCode, response) => {
          if (statusCode === 404) {
            log(chalk.redBright("You'll need to run the generate command first to build a list of URLs from which to randomly select:")
            + "\n  tcrawl generate reddit\n    Scrapes news websites from " + chalk.bold.underline("https://www.reddit.com/r/politics/wiki/whitelist")
            )
          } else if (response.url) {
            log("Randomly selected " + chalk.greenBright(response.url) + " for crawling.")
            if (response.filepath) {
              log("Scraper output can be found on the server at " + chalk.greenBright(response.filepath))
            }
          }
        })
      } else if (arg === "-f") {
        arg = process.argv[4]
        if (arg && arg.length > 0) {
          let domains: Buffer|string|any = readFileSync(arg)
          domains = domains.toString()
          domains = JSON.parse(domains)
          domains = domains.map((d: string) => str2url(d)) as URL[]
          log(`Crawling ${chalk.greenBright(domains.length.toString())} domains`)
          commands.crawl(PORT, HOST, domains)
        } else {
          log("Pass a file with a list of domains to tcrawl using the -f option")
        }
      } else if (arg) {
        // argument exists but we haven't handled yet
        const url = str2url(arg)
        if (url) {
          commands.crawl(PORT, HOST, [url], (statusCode, response) => {
            if (statusCode === 400) {
              log(`Error crawling ${chalk.red(url.href)}`)
            }
            else {
              log(`Crawling ${chalk.greenBright(url.href)}`)
              if (response.filepath) {
                log("Scraper output can be found on the server at " + chalk.greenBright(response.filepath))
              }
            }
          })
        } else {
          commands.crawlNational(PORT, HOST, arg.toLowerCase(), (statusCode, response) => {
            if (statusCode === 404) {
              log(chalk.redBright("You'll need to run the generate command first to build a list of national news sites:")
              + "\n  tcrawl generate wikipedia\n    Scrapes national news websites from "
              + chalk.bold.underline("https://en.wikipedia.org/wiki/Category:News_websites_by_country"))
            } else if (url) {
              log(`Turbo Crawl will crawl ${chalk.greenBright(arg)} news` )
              if (response.filepath) {
                log("Scraper output can be found on the server at " + chalk.greenBright(response.filepath))
              }
            }
          })
        }
      }
    } else if (command === "help") {
      log(
`
$ ${chalk.reset("tcrawl crawl")}              | Begins crawling one or more websites.
                            |
$ ${chalk.reset("tcrawl end <domain>")}       | Ends crawling of specified website
                            |
$ ${chalk.reset("tcrawl endall")}             | Ends all crawlers
                            |
$ ${chalk.reset("tcrawl generate")}           | Generates lists of websites for Turbo Crawl to visit.
                            |
$ ${chalk.reset("tcrawl list")}               | List all active crawlers
                            |
$ ${chalk.reset("tcrawl shutdown")}           | Stops the Turbo Crawl server
                            |
$ ${chalk.reset("tcrawl start")}              | Starts the Turbo Crawl server
                            |

`)
    } 
  }
}