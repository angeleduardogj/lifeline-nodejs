function standardResponse(message, data = null, error = null) {
  return { message, data, error }
}

module.exports = { standardResponse }