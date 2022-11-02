import React from 'react'
import clsx from 'clsx'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  Svg: React.ComponentType<React.ComponentProps<'svg'>>
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Language Agnostic',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>Markdown, AsciiDoc, Wikitext, HTML ... Use any markup language of your choice with same first class support.</>
    ),
  },
  {
    title: 'Versatile Content Types',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: <>Manage your assets in a single place. Code, image, video, audio, PDF, and more.</>,
  },
  {
    title: 'Open Storage Format',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        All the data are just common folders and files, with full readability & editability outside Kiwi. What's more,
        Kiwi makes any existing folder browsable.
      </>
    ),
  },
  {
    title: 'Powerful Macro',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Code as you write, enhance your expressive power without software-specific syntax: Typescript is the ONLY hack.
      </>
    ),
  },
  {
    title: 'Builtin Monaco Editor',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: <>Enjoy the same editing experience as the most popular editor, VS Code, in browser.</>,
  },
  {
    title: 'Open API',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: <>Simple and Documented HTTP API.</>,
  },
]

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
