"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Search, Check, Loader2 } from "lucide-react";
import Image from "next/image";

export interface UserSuggestion {
  id: string;
  firebase_id: string;
  name: string;
  favorite_team_logo: string | null;
  avatar_url: string | null;
}

interface UserSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onUserSelect: (user: UserSuggestion | null) => void;
  selectedUser: UserSuggestion | null;
  placeholder?: string;
  disabled?: boolean;
}

export function UserSearchInput({
  value,
  onChange,
  onUserSelect,
  selectedUser,
  placeholder = "Digite seu nome...",
  disabled = false,
}: UserSearchInputProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchUsers = useCallback(async (searchTerm: string) => {
    const normalizedTerm = searchTerm.trim();
    const canSearch = normalizedTerm.length >= 2 || /^\d+$/.test(normalizedTerm);

    if (!canSearch) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/auth/user-search?q=${encodeURIComponent(normalizedTerm)}`);
      if (!response.ok) {
        setSuggestions([]);
        setSearchError("Não foi possível buscar usuários agora.");
        return;
      }

      const result = (await response.json()) as { data?: UserSuggestion[] };
      setSuggestions(result.data ?? []);
    } catch (err) {
      console.error("Error searching users:", err);
      setSuggestions([]);
      setSearchError("Não foi possível buscar usuários agora.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && !selectedUser) {
        searchUsers(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, selectedUser, searchUsers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelectUser(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelectUser = (user: UserSuggestion) => {
    onUserSelect(user);
    onChange(user.name);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (selectedUser && newValue !== selectedUser.name) {
      onUserSelect(null);
    }

    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (value.length >= 2 && !selectedUser) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        {selectedUser ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {selectedUser.favorite_team_logo ? (
              <Image
                src={selectedUser.favorite_team_logo}
                alt=""
                width={24}
                height={24}
                className="rounded-full object-contain"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brm-primary/20 flex items-center justify-center">
                <User className="w-3 h-3 text-brm-primary" />
              </div>
            )}
          </div>
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brm-text-muted" />
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          name="brm-user-search"
          className={`w-full py-3 bg-brm-background border text-brm-text-primary placeholder:text-brm-text-muted focus:outline-none focus:ring-2 focus:ring-brm-primary focus:border-transparent transition-all ${
            selectedUser
              ? "pl-12 pr-10 border-brm-primary/50"
              : "pl-12 pr-4 border-white/10"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} rounded-none`}
        />

        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brm-primary animate-spin" />
        )}

        {selectedUser && !isLoading && (
          <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
        )}
      </div>

      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && !selectedUser && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 py-2 bg-brm-card border border-white/10 shadow-xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar"
          >
            {suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                  highlightedIndex === index
                    ? "bg-brm-primary/20"
                    : "hover:bg-white/5"
                } cursor-pointer`}
              >
                <div className="relative w-10 h-10 shrink-0">
                  {user.favorite_team_logo ? (
                    <Image
                      src={user.favorite_team_logo}
                      alt=""
                      fill
                      className="rounded-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-linear-to-br from-brm-primary to-brm-accent flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <p className="font-medium text-brm-text-primary">
                    {highlightName(user.name, value)}
                  </p>
                  <p className="text-xs text-brm-text-muted">
                    ID: {user.firebase_id}
                  </p>
                </div>

                {highlightedIndex === index && (
                  <div className="text-xs text-brm-primary font-medium">
                    Enter ↵
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {showDropdown && value.length >= 2 && suggestions.length === 0 && !isLoading && !selectedUser && !searchError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 p-4 bg-brm-card border border-white/10 text-center"
          >
            <p className="text-brm-text-muted text-sm">
              Nenhum usuário encontrado com &ldquo;{value}&rdquo;
            </p>
          </motion.div>
        )}

        {showDropdown && !!searchError && !selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 p-4 bg-brm-card border border-red-400/30 text-center"
          >
            <p className="text-red-300 text-sm">{searchError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function highlightName(name: string, query: string): React.ReactNode {
  if (!query) return name;

  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeQuery})`, "gi");
  const parts = name.split(regex);

  return parts.map((part, index) => {
    const matches = part.toLowerCase() === query.toLowerCase();
    if (!matches) return part;
    return (
      <span key={index} className="text-brm-primary font-semibold">
        {part}
      </span>
    );
  });
}
