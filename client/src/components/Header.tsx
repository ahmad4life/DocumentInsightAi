import { useLocation } from "wouter";

export default function Header() {
  const [, navigate] = useLocation();
  
  return (
    <header className="bg-white border-b border-[#E9ECEF] px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <div className="text-primary mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-2xl"
          >
            <path d="M14 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
            <path d="M13.5 19h3a3.5 3.5 0 1 0 0-7h-10a3.5 3.5 0 1 0 0 7h4.5"></path>
            <path d="M12 13v3"></path>
            <path d="M10 16h4"></path>
          </svg>
        </div>
        <h1 
          className="text-xl font-bold text-primary cursor-pointer" 
          onClick={() => navigate("/")}
        >
          DocuChat
        </h1>
      </div>
      <div className="flex items-center">
        <button
          className="mr-4 text-[#6C757D] hover:text-primary"
          aria-label="Help"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <path d="M12 17h.01"></path>
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium">
          DC
        </div>
      </div>
    </header>
  );
}
