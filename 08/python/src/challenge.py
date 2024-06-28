import sys

def read_file(file_name: str) -> str:
    with open(file_name, 'r', encoding='utf-8') as file:
        return file.read()

# Assuming the utility functions are in a module named utils
from utils import parse_challenge, solve

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide the input file name as an argument.")
        sys.exit(1)
    
    file_name = sys.argv[1]
    print(f"Reading {file_name}")

    input_data = read_file(file_name)

    walker = parse_challenge(input_data)
    power_walker = parse_challenge(input_data)

    # res_part1 = solve(parsed_input)  # If needed, implement and call solve
    # res_part2 = solve_part2_heavily_optimized(walker)  # If needed, implement and call solve_part2_heavily_optimized
    # res_magic = magic_solve_part2(parsed_input)  # If needed, implement and call magic_solve_part2
    res_power = solve(power_walker)

    # print("Part 1's result is", res_part1)  # Uncomment if needed
    # print("Part 2's result is", res_part2)  # Uncomment if needed
    # print("Part 2's result is", res_magic)  # Uncomment if needed
    print("Part 2's result is", res_power)
