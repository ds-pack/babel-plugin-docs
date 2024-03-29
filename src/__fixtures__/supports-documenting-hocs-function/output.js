// Usage:
// <Foo bar="blah" />
export default function makeFoo(Comp) {
  function Foo(props) {
    return <div />
  }

  let test
  Foo.propTypes = {
    // some comment here
    bar: PropTypes.string.isRequired,
    // another comment here
    // multi-line this time
    foo: PropTypes.bool,

    /**
     * Block comment here
     *
     * With multiple lines
     */
    test,
  }
  Foo.defaultProps = {
    bar: 'foo',
    foo: false,
    test: 'anotherTest',
  }
  return Foo
}
