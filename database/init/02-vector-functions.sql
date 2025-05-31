-- Utility functions for vector operations

-- Function to calculate cosine similarity
CREATE OR REPLACE FUNCTION app.cosine_similarity(a vector, b vector)
RETURNS float AS $$
BEGIN
  RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate euclidean distance
CREATE OR REPLACE FUNCTION app.euclidean_distance(a vector, b vector)
RETURNS float AS $$
BEGIN
  RETURN a <-> b;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to normalize vectors
CREATE OR REPLACE FUNCTION app.normalize_vector(v vector)
RETURNS vector AS $$
DECLARE
  magnitude float;
BEGIN
  magnitude := sqrt((SELECT sum(x*x) FROM unnest(v::float[]) AS x));
  IF magnitude = 0 THEN
    RETURN v;
  END IF;
  RETURN (v / magnitude)::vector;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
