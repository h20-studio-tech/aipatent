import marvin
import pandas as pd
from app.models import Technology

async def generate_synthetic_data(
    model_class,
    n_samples: int = 30,
    instructions: str = None,
    output_file: str = None,
    fields: list[str] = None
) -> pd.DataFrame:
    """
    Generate synthetic data using Marvin and save to CSV.
    
    Args:
        model_class: The model class to generate instances of
        n_samples: Number of samples to generate
        instructions: Custom instructions for Marvin
        output_file: Path to save CSV file (defaults to lowercase model name)
        fields: List of model fields to extract (defaults to all fields)
    """
    # Generate instances using Marvin
    instances = await marvin.generate_async(
        target=model_class,
        n=n_samples,
        instructions=instructions or f"Generate {n_samples} {model_class.__name__.lower()}s"
    )
    
    # If no fields specified, try to get all attributes that don't start with '_'
    if fields is None:
        sample = instances[0]
        fields = [attr for attr in dir(sample) if not attr.startswith('_')]
    
    # Extract data into list of dictionaries
    data = []
    for instance in instances:
        row = {}
        for field in fields:
            value = getattr(instance, field)
            # Handle list/tuple fields by joining with commas
            if isinstance(value, (list, tuple)):
                value = ", ".join(value)
            row[field] = value
        data.append(row)
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Save to CSV
    if output_file is None:
      output_file = f"{model_class.__name__.lower()}.csv"
    df.to_csv(f'synthetic_data/{output_file}', index=False)
    
    return df
