'use strict'

const SlackBot = require('./SlackBot')
const GitHubApiClient = require("./GitHubApiClient")
const PullRequests = require('./PullRequests')
const Parser = require('./Parser')
const _ = require('lodash')

class App {
  static start() {
    this.beforeValidate()

    const controller = new SlackBot().getController()

    controller.hears("ls (.+)", ["direct_message", "direct_mention", "mention"], this.ls)
  }

  static ls(bot, message) {
    const conditions = new Parser(message.match[1]).parse()

    const client = new GitHubApiClient()

    client.getAllPullRequests(conditions).then((prs) => {
      const messages = new PullRequests(prs, conditions).convertToSlackMessages()

      if (messages.length > 0) {
        _.each(messages, (pr) => bot.say({text: pr, unfurl_links: false, unfurl_media: false, channel: message.channel}))
      } else {
        bot.say({text: 'No pull requests for now.', channel: message.channel})
      }
    })
  }

  static beforeValidate() {
    let errors = []

    if (!process.env.GITHUB_AUTH_TOKEN) {
      errors.push('Error: GITHUB_AUTH_TOKEN is missing.')
    }
    if (!process.env.SLACK_BOT_TOKEN) {
      errors.push('Error: SLACK_BOT_TOKEN is missing.')
    }

    if (errors.length > 0) {
      errors.forEach((error) => console.error(error))
      console.error('Cannot continue to start the bot due to critical lack of parameters.')
      process.exit(1)
    }
  }
}

module.exports = App
