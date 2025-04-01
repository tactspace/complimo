import React from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

export default function Navbar() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const handleDeleteDocuments = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/delete-documents`);
      console.log(response.data);
      if (response.status === 200) {
        toast.success('Documents deleted successfully!', {
          duration: 3000,
          position: 'bottom-right',
        });
      }
    } catch (error) {
      toast.error('Failed to delete documents', {
        duration: 3000,
        position: 'bottom-right',
      });
    }
  };

  return (
    <nav className="w-full bg-[#FF6600] text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <Link href="/" className=" flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Complimo Logo" 
            width={24} 
            height={24}
            className="h-6 w-auto"
          />
          <span className="font-bold text-xl tracking-tight">Complimo</span>
        </Link>
      </div>
      <div className="flex gap-6 font-medium text-sm uppercase tracking-wider">
        <Link href="/chat" className="py-1  transition-all duration-300 hover:drop-shadow-glow-white">Monitor Compliance</Link>
        <Link href="/" className="py-1  transition-all duration-300 hover:drop-shadow-glow-white">Home</Link>
        <Menu as="div" className="relative">
          <Menu.Button className="py-1 transition-all duration-300 hover:drop-shadow-glow-white">
            ADMIN
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href={`${BASE_URL}/documents`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700`}
                    >
                      VIEW DOCUMENTS
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDeleteDocuments}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      DELETE DOCUMENTS
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/admin/generate-report"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700`}
                    >
                      Generate Report
                    </Link>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
      <Toaster />
    </nav>
  );
}