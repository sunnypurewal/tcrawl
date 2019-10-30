#!/usr/bin/env node

const VERSION = "v0.1.0"
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

  Here are some commands to get you started:

${chalk.reset("$ tcrawl start")}    ${chalk.inverse("You probably want to do this first.")}
  ${chalk.reset("$ tcrawl start &")}    ${chalk.inverse("Starts the server in the background")}

${chalk.reset("$ tcrawl generate")} ${chalk.inverse("Generates lists of websites for Turbo Crawl to visit.")}

${chalk.reset("$ tcrawl crawl")}    ${chalk.inverse("Begins crawling one or more websites")}

${chalk.reset("$ tcrawl help")}     ${chalk.inverse("Show a list of all commands")}
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
    commands.crawl(PORT, HOST, [url])
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
    Crawlers:
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
    } else if (command === "generate") {
      const arg = process.argv[3]
      if (!arg || arg.length === 0) {
        log(chalk.blueBright("\nThe generate command:")
        + "\nAutomatically generates lists of websites to be crawled"
        + "\n  tcrawl generate reddit\n    Scrapes news websites from " + chalk.bold.underline("https://www.reddit.com/r/politics/wiki/whitelist")
        + "\n  tcrawl generate nationalnews\n    Scrapes national news websites from "
        + chalk.bold.underline("https://en.wikipedia.org/wiki/Category:News_websites_by_country"))
      } else if (arg === "reddit") {
        log("Scraping", chalk.bold.underline("https://www.reddit.com/r/politics/wiki/whitelist"), "for domain names")
        commands.genreddit((count, filename) => {
          log(count > 0 ?
            chalk.greenBright(`Scraped ${count} domain names into ${filename}`)
            : chalk.redBright("Failed to scrape anything."))
        })
      } else if (arg === "nationalnews") {
        log("Scraping", chalk.bold.underline("https://en.wikipedia.org/wiki/Category:News_websites_by_country"), "for domain names")
        commands.gencountries((count) => {
          log(count > 0 ?
            chalk.greenBright(`
    Scraped ${count} domain names from Wikipedia Category: ${chalk.bold("News websites by country")}`)
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
        + "\n  tcrawl crawl -f filename\n    Pass in a newline-delimited file of URLs to crawl.\n    That means one URL per line.")
      }
      if (arg === "random") {
        commands.random(PORT, HOST, (url) => {
          log((url ? chalk.greenBright(`Randomly selected ${url.href} for crawling`) : chalk.redBright("Turbo Crawl failed to random crawl")))
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
      } else {
        const url = str2url(arg)
        if (url) {
          commands.crawl(PORT, HOST, [url], ((success, err) => {
            if (success) {
              log(`Crawling ${chalk.bold(url.href)}`)
            } else if (err) {
              log(`Error crawling ${chalk.bold(url.href)} ${err.message}`)
            }
          }))
        } else {
          commands.crawlNational(PORT, HOST, arg.toLowerCase(), () => {
            log(`Turbo Crawl will crawl ${chalk.greenBright(arg)} news` )
          })
        }
      }
    }
  }
}