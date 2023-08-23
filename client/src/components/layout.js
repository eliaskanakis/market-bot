import Link from 'next/link'

export default function Layout({ children }) {
  return (
    <>
      {/* {window ? "No SSR" : "SSR"} */}
{/*       <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <header class="d-flex flex-wrap justify-content-center py-3 mb-0 border-bottom">
          <Link href="/" class="navbar-brand d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
            <span class="fs-4">MarketBot</span>
          </Link>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav nav nav-pills">
              <li class="nav-item1"><Link href="/" class="nav-link active" aria-current="page" id="navbar1">Home</Link></li>
              <li class="nav-item"><Link href="/shopping-list" class="nav-link" id="navbar2">Shopping list</Link></li>
              <li class="nav-item"><Link href="/shopping" class="nav-link" id="navbar2">Start Shopping</Link></li>
              <li class="nav-item"><Link href="/about" class="nav-link" id="navbar2">About</Link></li>
            </ul>
          </div>
        </header>
      </nav> */}


      {<nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
          <Link class="navbar-brand" href="/"><span class="fs-4">MarketBot</span></Link>

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
      </nav>}
      <main>{children}</main>
    </>
  )
}