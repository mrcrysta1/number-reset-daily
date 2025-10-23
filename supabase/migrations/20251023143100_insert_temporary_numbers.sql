-- Insert 5 temporary phone numbers for testing daily reset functionality
INSERT INTO phone_numbers (number, last_used)
VALUES 
  ('+923001234567', NULL),
  ('+923007654321', NULL),
  ('+923009876543', NULL),
  ('+923005555555', NULL),
  ('+923002222222', NULL);

-- These are temporary test numbers that can be used for the daily reset functionality
