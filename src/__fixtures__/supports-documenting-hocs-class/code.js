// Usage:
// <Foo bar="blah" />
export default function makeFoo(Comp) {
  let test

  return class Foo extends React.Component {
    static propTypes = {
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

    static defaultProps = {
      bar: 'foo',
      foo: false,
      test: 'anotherTest',
    }

    render() {
      return <div />
    }
  }
}
