function coalesce(visitors) {
  return function (path, state) {
    visitors.forEach((visitor) => {
      visitor(path, state)
    })
  }
}

export function mergeVisitors(visitorA, visitorB) {
  let tempResult = {}

  Object.entries(visitorA).forEach(([astName, visitorFunction]) => {
    if (tempResult[astName]) {
      tempResult[astName].push(visitorFunction)
    } else {
      tempResult[astName] = [visitorFunction]
    }
  })
  Object.entries(visitorB).forEach(([astName, visitorFunction]) => {
    if (tempResult[astName]) {
      tempResult[astName].push(visitorFunction)
    } else {
      tempResult[astName] = [visitorFunction]
    }
  })

  return Object.entries(tempResult).reduce((acc, [astName, visitors]) => {
    acc[astName] = coalesce(visitors)
    return acc
  }, {})
}

export function formatComments(comments) {
  return comments
    .map((comment) => {
      if (comment.type === 'CommentBlock') {
        return `/*${comment.value}\n*/`
      }
      return comment.value
    })
    .join('\n')
}
