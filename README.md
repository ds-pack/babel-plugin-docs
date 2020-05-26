# Babel Plugin Docs

A collection of babel tooling for collecting documentation from source code of
components and hooks.

### Tools:

- Babel
- Jest

## TODO:

- Split up the code to be more maintainable
  - Separate files for each visitor
  - Need to architect a way to merge visitors without calling traverse manually,
    maybe wrapping the visitors in a higher-order function
- Add functionality for `propertyControls`
- Enumerate all open TODOs in the code
- Add tests for open TODOs
