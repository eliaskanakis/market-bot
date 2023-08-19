import Link from 'next/link'

export default function Layout({ children }) {
  return (
    <>
      {/* {window ? "No SSR" : "SSR"} */}
      <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
          <Link  class="navbar-brand" href="/">MarketBot</Link>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item">
                <Link class="nav-link" href="/shopping-list">Shopping list</Link>
              </li>
              <li class="nav-item">
                <Link class="nav-link" href="/shopping">Start Shopping</Link>
              </li>
              <li class="nav-item">
                <Link class="nav-link" href="/about">About</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}