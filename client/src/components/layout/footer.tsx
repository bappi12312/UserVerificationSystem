import { Link } from 'wouter';
import { FaDiscord, FaTwitter, FaGithub } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-background dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <Link href="/about">
              <span className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer">
                About
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/faq">
              <span className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer">
                FAQ
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/support">
              <span className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer">
                Support
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/contact">
              <span className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer">
                Contact
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/terms">
              <span className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer">
                Terms
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/privacy">
              <span className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer">
                Privacy
              </span>
            </Link>
          </div>
        </nav>
        <div className="mt-8 flex justify-center space-x-6">
          <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
            <span className="sr-only">Discord</span>
            <FaDiscord className="h-6 w-6" />
          </a>
          <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
            <span className="sr-only">Twitter</span>
            <FaTwitter className="h-6 w-6" />
          </a>
          <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
            <span className="sr-only">GitHub</span>
            <FaGithub className="h-6 w-6" />
          </a>
        </div>
        <p className="mt-8 text-center text-base text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} GameServers. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
